import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { sessionApi } from "../api/sessions";

export const useCreateSession = () => {
  const result = useMutation({
    mutationKey: ["createSession"],
    mutationFn: sessionApi.createSession,
    onError: (error) => {
      // Log details so we can troubleshoot if createSession fails
      console.error("Create session failed", {
        status: error.response?.status,
        data: error.response?.data,
      });
      const msg = error.response?.data?.message || "Failed to create room";
      toast.error(msg);
    },
  });

  return result;
};

export const useActiveSessions = (search = "") => {
  const result = useQuery({
    queryKey: ["activeSessions", search],
    queryFn: () => sessionApi.getActiveSessions(search),
    refetchInterval: 10000,
  });

  return result;
};

export const useMyRecentSessions = () => {
  const result = useQuery({
    queryKey: ["myRecentSessions"],
    queryFn: sessionApi.getMyRecentSessions,
  });

  return result;
};

export const useSessionById = (id, { pauseRefetch = false } = {}) => {
  const result = useQuery({
    queryKey: ["session", id],
    queryFn: () => sessionApi.getSessionById(id),
    enabled: !!id,
    // Stop background polling as soon as the caller signals they're leaving.
    // This prevents a last-second refetch from flipping `isParticipant` to
    // false just before navigate() fires, which would cause a visible flicker.
    refetchInterval: pauseRefetch ? false : 5000,
  });

  return result;
};

export const useJoinSession = () => {
  const result = useMutation({
    mutationKey: ["joinSession"],
    mutationFn: sessionApi.joinSession,
    onSuccess: () => {
      toast.success("Joined session successfully!");
    },
    onError: (error) => {
      // alreadyInSession (409) is handled by individual components with a modal
      if (error.response?.data?.alreadyInSession) return;
      toast.error(error.response?.data?.message || "Failed to join session");
    },
  });

  return result;
};

export const useEndSession = () => {
  const result = useMutation({
    mutationKey: ["endSession"],
    mutationFn: sessionApi.endSession,
    onSuccess: () => toast.success("Session ended successfully!"),
    onError: (error) => toast.error(error.response?.data?.message || "Failed to end session"),
  });

  return result;
};

export const useValidatePassword = () => {
  return useMutation({
    mutationKey: ["validatePassword"],
    mutationFn: sessionApi.validatePassword,
  });
};

export const useSessionHistory = (id) => {
  return useQuery({
    queryKey: ["sessionHistory", id],
    queryFn: () => sessionApi.getSessionHistory(id),
    enabled: !!id,
  });
};
