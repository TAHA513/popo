import { Storage, File } from "@google-cloud/storage";
import { Response } from "express";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// Object storage client
export const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  constructor() {}

  // Get the bucket name from environment
  getBucketName(): string {
    const publicPaths = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
    const bucketPath = publicPaths.split(",")[0]?.trim();
    if (!bucketPath) {
      throw new Error("PUBLIC_OBJECT_SEARCH_PATHS not set");
    }
    // Extract bucket name from path like '/replit-objstore-b9b8cbbd-6b8d-4fcb-b924-c5e56e084f16/public'
    return bucketPath.split("/")[1];
  }

  // Upload file to object storage
  async uploadFile(filename: string, buffer: Buffer, mimetype: string): Promise<string> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(`public/${filename}`);

    await file.save(buffer, {
      metadata: {
        contentType: mimetype,
      },
      // Remove public: true to avoid access prevention issues
    });

    console.log(`✅ Uploaded to object storage: public/${filename}`);
    return filename;
  }

  // Get signed URL for a file (temporary access)
  async getSignedUrl(filename: string): Promise<string> {
    const bucketName = this.getBucketName();
    const bucket = objectStorageClient.bucket(bucketName);
    const file = bucket.file(`public/${filename}`);
    
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });
    
    return signedUrl;
  }

  // Download/serve file from object storage
  async downloadObject(filename: string, res: Response): Promise<void> {
    try {
      const bucketName = this.getBucketName();
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(`public/${filename}`);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        throw new ObjectNotFoundError();
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();
      
      // Set appropriate headers
      res.set({
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });

      // Stream the file to the response
      const stream = file.createReadStream();
      
      stream.on("error", (err) => {
        console.error("Stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file" });
        }
      });

      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        if (error instanceof ObjectNotFoundError) {
          res.status(404).json({ error: "File not found" });
        } else {
          res.status(500).json({ error: "Error downloading file" });
        }
      }
    }
  }
}

export const objectStorage = new ObjectStorageService();