export type ReviewStatus = "PENDING" | "APPROVED" | "HIDDEN";

/** "Wish approved", "3 photos hidden", "Photo restored"… for the toast after a review action. */
export function reviewMessage(noun: "Wish" | "Photo", count: number, from: ReviewStatus, to: ReviewStatus) {
  const verb = to === "APPROVED" ? (from === "HIDDEN" ? "restored" : "approved") : to === "HIDDEN" ? "hidden" : "moved back to pending";
  const subject = count === 1 ? noun : `${count} ${noun === "Wish" ? "wishes" : "photos"}`;
  return `${subject} ${verb}`;
}
