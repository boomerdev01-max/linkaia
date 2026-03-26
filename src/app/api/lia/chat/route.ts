import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// ─── Prompt système de Lia ────────────────────────────────────────────────────
function buildSystemPrompt(userContext: {
  prenom: string;
  pseudo?: string | null;
  level: string;
}) {
  return `Tu es Lia, l'assistante IA officielle de Linkaïa — un réseau social intercontinental dédié aux rencontres authentiques et aux connexions humaines sans frontières.

TON IDENTITÉ :
- Tu t'appelles Lia (pas ChatGPT, pas un LLM générique)
- Tu es bienveillante, chaleureuse, légèrement espiègle
- Tu parles TOUJOURS en français, de façon naturelle et fluide
- Tu tutoies l'utilisateur

TON RÔLE SUR LINKAÏA :
- Aide les utilisateurs à mieux utiliser l'app (profil, matchs, lives, cadeaux L-Gems...)
- Tu peux discuter de tous les sujets : amour, culture, voyages, actualités, conseils de vie
- Tu connais le contexte de la plateforme : système de L-Gems, Diamonds, lives, Club LWB
- Tu peux donner des conseils de rencontres et de relations

RÈGLES ABSOLUES :
- Ne jamais prétendre être humain si on te demande directement
- Ne jamais révéler que tu es basé sur un LLM open source
- Rester positif et encourageant
- Réponses courtes et conversationnelles (2-4 phrases max sauf si l'user demande des détails)

CONTEXTE UTILISATEUR ACTUEL :
- Prénom : ${userContext.prenom}
- Pseudo : ${userContext.pseudo || "non défini"}
- Niveau : ${userContext.level}

Tu parles à ${userContext.prenom}. Commence toujours par son prénom si c'est le début de la conversation.`;
}

// ─── Appel Ollama (local / dev) ───────────────────────────────────────────────
async function callOllama(
  messages: { role: string; content: string }[],
  systemPrompt: string,
) {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.2",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 512,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.message.content as string;
}

// ─── Appel Groq (prod) ────────────────────────────────────────────────────────
async function callGroq(
  messages: { role: string; content: string }[],
  systemPrompt: string,
) {
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.8,
        max_tokens: 512,
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content as string;
}

// ─── Route principale ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  const { user } = auth;

  // 2. Lire le message entrant
  const body = await request.json();
  const { message } = body as { message: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message vide" }, { status: 400 });
  }

  try {
    // 3. Récupérer ou créer la conversation unique de cet user
    let conversation = await prisma.liaConversation.findUnique({
      where: { userId: user.id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 20, // On envoie les 20 derniers messages au LLM (contexte glissant)
        },
      },
    });

    if (!conversation) {
      conversation = await prisma.liaConversation.create({
        data: { userId: user.id },
        include: { messages: true },
      });
    }

    // 4. Sauvegarder le message de l'user
    await prisma.liaMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message.trim(),
      },
    });

    // 5. Construire le contexte utilisateur pour le system prompt
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        prenom: true,
        level: true,
        profil: { select: { pseudo: true } },
      },
    });

    const systemPrompt = buildSystemPrompt({
      prenom: fullUser?.prenom ?? "ami",
      pseudo: fullUser?.profil?.pseudo,
      level: fullUser?.level ?? "free",
    });

    // 6. Préparer l'historique pour le LLM
    const history = conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    // Ajouter le nouveau message de l'user
    history.push({ role: "user", content: message.trim() });

    // 7. Appeler le bon LLM selon l'environnement
    let reply: string;
    const useGroq =
      process.env.NODE_ENV === "production" && process.env.GROQ_API_KEY;

    if (useGroq) {
      reply = await callGroq(history, systemPrompt);
    } else {
      reply = await callOllama(history, systemPrompt);
    }

    // 8. Sauvegarder la réponse de Lia
    await prisma.liaMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
      },
    });

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("❌ Lia API error:", error);

    // Erreur spécifique si Ollama n'est pas lancé
    if (
      error.message?.includes("fetch failed") ||
      error.code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        {
          error:
            "Lia est temporairement indisponible. Assure-toi qu'Ollama est lancé.",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// ─── GET : récupérer l'historique ─────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.authorized || !auth.user) {
    return NextResponse.json(auth.errorResponse, { status: auth.status });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor"); // pagination
  const limit = 30;

  try {
    const conversation = await prisma.liaConversation.findUnique({
      where: { userId: auth.user.id },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ messages: [], hasMore: false });
    }

    const messages = conversation.messages.reverse();
    const hasMore = messages.length > limit;
    const result = hasMore ? messages.slice(1) : messages;

    return NextResponse.json({
      messages: result,
      hasMore,
      nextCursor: hasMore ? result[0].id : null,
    });
  } catch (error) {
    console.error("❌ Lia GET error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
