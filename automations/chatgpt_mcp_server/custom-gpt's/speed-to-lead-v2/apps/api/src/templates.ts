type Lead = {
  full_name: string | null;
  company: string | null;
  email: string | null;
  need_summary: string;
  urgency: "low" | "medium" | "high";
  next_step: "call" | "demo" | "info" | "pricing" | "support";
};

function firstName(fullName: string | null) {
  if (!fullName) return null;
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || null;
}

export function renderSpeedToLeadV1(lead: Lead) {
  const fn = firstName(lead.full_name);
  const greeting = fn ? `Hi ${fn},` : "Hi there,";
  const companyBit = lead.company ? ` at ${lead.company}` : "";
  const urgencyLine =
    lead.urgency === "high"
      ? "I saw this looks time-sensitive—happy to move quickly."
      : lead.urgency === "medium"
        ? "Happy to help get this moving."
        : "Happy to share a quick next step.";

  const cta =
    lead.next_step === "pricing"
      ? "What’s the rough scope (team size / volume) so I can point you to the right pricing range?"
      : lead.next_step === "demo"
        ? "Would you like a quick demo this week—do Tue 11:00 or Thu 15:00 work?"
        : lead.next_step === "call"
          ? "Open to a quick 10-minute call—do Tue 11:00 or Thu 15:00 work?"
          : lead.next_step === "support"
            ? "Can you share the key details (error text + when it started) so I can route it correctly?"
            : "What’s the best next step—quick call or a couple details over email?";

  const subject =
    lead.next_step === "pricing"
      ? "Pricing for your use case"
      : lead.next_step === "demo"
        ? "Quick demo option"
        : "Following up";

  const body = [
    greeting,
    "",
    `Thanks for reaching out${companyBit}. You mentioned: ${lead.need_summary}`,
    urgencyLine,
    "",
    "We can usually get you a clear answer in one short step.",
    cta,
    "",
    "— Viss",
  ].join("\n");

  return { subject, body };
}
