import cloudinary from "../config/cloudinary";

interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  mimetype: string,
  folder: string,
): Promise<UploadResult> => {
  try {
    const base64String = `data:${mimetype};base64,${fileBuffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64String, {
      folder,
      resource_type: "image",
    });

    return {
      url: result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image");
  }
};

export const deleteFromCloudinary = async (
  publicId: string,
): Promise<boolean> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
};
