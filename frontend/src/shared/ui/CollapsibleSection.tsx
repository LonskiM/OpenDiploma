import { useState } from "react";

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

const CollapsibleSection = ({
    title,
    defaultOpen = false,
    children,
}: CollapsibleSectionProps) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <section className="collapse-section">
            <button
                type="button"
                className="collapse-toggle"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
            >
                <span>{title}</span>
                <span className="collapse-toggle-icon" aria-hidden>
                    {open ? "▾" : "▸"}
                </span>
            </button>
            {open ? <div className="collapse-content">{children}</div> : null}
        </section>
    );
};

export default CollapsibleSection;
