import { useState } from "react";

interface AvatarUploaderProps {
    avatarUrl?: string;
    onUpload: (dataUrl: string) => Promise<void>;
}

const AvatarUploader = ({ avatarUrl, onUpload }: AvatarUploaderProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result ?? ""));
                reader.onerror = () => reject(new Error("Failed to read image file"));
                reader.readAsDataURL(file);
            });
            await onUpload(dataUrl);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : "Failed to upload avatar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-block">
            <img
                src={avatarUrl || "https://placehold.co/96x96?text=Avatar"}
                alt="User avatar"
                width={96}
                height={96}
                style={{ borderRadius: "50%", objectFit: "cover" }}
            />
            <label className="ghost-button" style={{ width: "fit-content" }}>
                {loading ? "Uploading..." : "Upload new avatar"}
                <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    disabled={loading}
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            void handleFile(file);
                        }
                    }}
                />
            </label>
            {error ? <p className="auth-error">{error}</p> : null}
        </div>
    );
};

export default AvatarUploader;
