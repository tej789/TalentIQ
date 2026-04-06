import { chatClient } from "../lib/stream.js";

export async function getStreamToken(req, res) {
  try {
    const userId = req.user.clerkId;
    const userName = req.user.name;
    const userImage = req.user.image;
    const { callId } = req.query;

    // Ensure the user exists in Stream before generating a token.
    // This covers cases where the Inngest webhook (clerk/user.created)
    // hasn't fired yet or failed — e.g. a brand-new user joining a session.
    await chatClient.upsertUser({
      id: userId,
      name: userName,
      image: userImage,
    });

    // If a callId is provided, ensure the user is a member of that chat channel.
    // This guarantees membership even if the joinSession addMembers call
    // was skipped (already-joined path) or previously failed.
    if (callId) {
      try {
        const channel = chatClient.channel("messaging", callId);
        await channel.addMembers([userId]);
      } catch (memberErr) {
        // Log but don't fail — channel may not exist yet (host creating)
        console.warn("Could not add user to chat channel:", memberErr.message);
      }
    }

    const token = chatClient.createToken(userId);

    res.status(200).json({
      token,
      userId,
      userName,
      userImage,
    });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
