import { useTranslation } from "@/shared/lib/i18n";

type ChipVariant = "pending" | "approved" | "rejected";

interface ChipProps {
    label: string;
    variant?: ChipVariant;
}

const statusToVariant = (status: string): ChipVariant => {
    const normalized = status.toUpperCase();
    if (normalized === "APPROVED") return "approved";
    if (normalized === "REJECTED") return "rejected";
    return "pending";
};

export const Chip = ({ label, variant = "pending" }: ChipProps) => (
    <span className={`chip chip-${variant}`}>{label}</span>
);

export const StatusChip = ({ status }: { status: string }) => {
    const { t } = useTranslation();
    const normalized = status.toUpperCase();
    const labelKey =
        normalized === "APPROVED" || normalized === "REJECTED" || normalized === "PENDING"
            ? (`status.${normalized}` as const)
            : null;
    const label = labelKey ? t(labelKey) : status;

    return <Chip label={label} variant={statusToVariant(status)} />;
};
