import { useState } from "react";
import { useTranslation } from "@/shared/lib/i18n";

interface AvatarUploaderProps {
    avatarUrl?: string;
    onUpload: (dataUrl: string) => Promise<void>;
}

const AvatarUploader = ({ avatarUrl, onUpload }: AvatarUploaderProps) => {
    const { t } = useTranslation();
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
            setError(uploadError instanceof Error ? uploadError.message : t("messages.uploadAvatarFailed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="avatar-uploader">
            {avatarUrl ? (
                <img src={avatarUrl} alt="" className="avatar avatar-lg" />
            ) : (
                <span className="avatar avatar-lg" aria-hidden>
                    ?
                </span>
            )}
            <label className="btn-secondary" style={{ width: "fit-content", cursor: "pointer" }}>
                {loading ? t("profile.uploading") : t("profile.uploadAvatar")}
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
