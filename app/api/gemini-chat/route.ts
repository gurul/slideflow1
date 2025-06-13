import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { marked } from "marked";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const file = formData.get("file") as File;
    const slideTimingsRaw = formData.get("slideTimings") as string | null;
    let slideTimings: number[] = [];
    if (slideTimingsRaw) {
      try {
        slideTimings = JSON.parse(slideTimingsRaw);
      } catch {}
    }

    // Build a context string for the AI
    let context = "";
    if (slideTimings.length > 0) {
      context = "Here are the timings (in seconds) spent on each slide: " +
        slideTimings.map((t, i) => `Slide ${i + 1}: ${t}s`).join(", ") + ". ";
      context += "Use the slide timings to give feedback on pacing, areas that may need more focus, or slides that may be too long or too short.";
    }

    // Prepend the context to the prompt
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    if (!file || !prompt) {
      return NextResponse.json({ error: "Missing file or prompt" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

    const contents = [
      { text: fullPrompt },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: base64,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents,
    });

    const markdown = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "No answer generated.";
    const html = marked(markdown);

    return NextResponse.json({
      answer: markdown,
      html,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
} 