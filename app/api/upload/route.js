import { NextResponse } from "next/server";
import azureStorage from "@/components/Azure";

export async function POST(req) {
  try {
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid Content-Type" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const userId = formData.get("userId") || "generic";
    const documentType = formData.get("documentType") || "upload";

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const response = await azureStorage.uploadDocument(
      buffer,
      file.name,
      file.type,
      userId,
      documentType
    );

    return NextResponse.json({
      success: true,
      fileUrl: response.url,
      filename: response.fileName,
      requestId: response.requestId,
      container: `${documentType}-uploads`,
    });

  } catch (error) {
    console.error("Azure Upload Failed:", error);
    return NextResponse.json({ error: error.message || "Azure upload failed" }, { status: 500 });
  }
}
//   const fd = new FormData();
//   fd.append("file", file);
//   fd.append("userId", session?.user?.id || "guest");
//   fd.append("documentType", documentType);

//   const res = await fetch("/api/upload", {
//     method: "POST",
//     body: fd,
//   });

//   if (!res.ok) throw new Error("Upload failed");
//   const data = await res.json();
  //make dummy url 