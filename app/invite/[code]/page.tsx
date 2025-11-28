"use client";

import { Button } from "@/app/components/ui/button";
import { acceptInvite, validateInvite } from "@/lib/inviteService";
import { getCurrentUser } from "@/utils/auth";
import { CheckCircle, Loader2, LogIn, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface InviteStatus {
  loading: boolean;
  valid: boolean;
  error?: string;
  serverName?: string;
  joined: boolean;
  serverId?: string;
}

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [status, setStatus] = useState<InviteStatus>({
    loading: true,
    valid: false,
    joined: false,
  });
  const [isJoining, setIsJoining] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in and validate invite
  useEffect(() => {
    async function checkInvite() {
      const user = await getCurrentUser();
      setIsLoggedIn(!!user);

      if (!code) {
        setStatus({
          loading: false,
          valid: false,
          error: "Invalid invite link",
          joined: false,
        });
        return;
      }

      try {
        const validation = await validateInvite(code);

        if (!validation.valid) {
          setStatus({
            loading: false,
            valid: false,
            error: validation.reason || "Invalid invite",
            joined: false,
          });
          return;
        }

        setStatus({
          loading: false,
          valid: true,
          joined: false,
        });
      } catch (error: unknown) {
        console.error("Error validating invite:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        // Check if server_invites table doesn't exist
        if (
          errorMessage.includes("server_invites") ||
          errorMessage.includes("does not exist")
        ) {
          setStatus({
            loading: false,
            valid: false,
            error: "Invite system is not set up yet",
            joined: false,
          });
        } else {
          setStatus({
            loading: false,
            valid: false,
            error: "Failed to validate invite",
            joined: false,
          });
        }
      }
    }

    checkInvite();
  }, [code]);

  const handleJoin = async () => {
    if (!isLoggedIn) {
      // Redirect to login with return URL
      router.push(`/login?returnUrl=/invite/${code}`);
      return;
    }

    setIsJoining(true);
    try {
      const result = await acceptInvite(code);

      if (result.success) {
        setStatus({
          loading: false,
          valid: true,
          joined: true,
          serverName: result.serverName,
          serverId: result.serverId,
        });
      } else {
        setStatus({
          loading: false,
          valid: false,
          error: result.message,
          joined: false,
        });
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      setStatus({
        loading: false,
        valid: false,
        error: "Failed to join server",
        joined: false,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToServer = () => {
    if (status.serverId) {
      router.push(`/?server=${status.serverId}`);
    } else {
      router.push("/");
    }
  };

  // Loading state
  if (status.loading) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="text-[#5865f2] animate-spin mx-auto" />
          <p className="text-[#b5bac1] text-lg">Validating invite...</p>
        </div>
      </div>
    );
  }

  // Successfully joined
  if (status.joined) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="bg-[#2b2d31] rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
          <CheckCircle size={64} className="text-green-500 mx-auto" />
          <div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Welcome to {status.serverName || "the server"}!
            </h1>
            <p className="text-[#b5bac1]">
              You&apos;ve successfully joined the server.
            </p>
          </div>
          <Button
            onClick={handleGoToServer}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-lg"
          >
            Go to Server
          </Button>
        </div>
      </div>
    );
  }

  // Invalid invite
  if (!status.valid) {
    return (
      <div className="min-h-screen bg-[#313338] flex items-center justify-center">
        <div className="bg-[#2b2d31] rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
          <XCircle size={64} className="text-[#ed4245] mx-auto" />
          <div>
            <h1 className="text-white text-2xl font-bold mb-2">
              Invalid Invite
            </h1>
            <p className="text-[#b5bac1]">
              {status.error || "This invite link is invalid or has expired."}
            </p>
          </div>
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-[#4e5058] text-white hover:bg-[#4e5058] h-12"
          >
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Valid invite - show join button
  return (
    <div className="min-h-screen bg-[#313338] flex items-center justify-center">
      <div className="bg-[#2b2d31] rounded-lg p-8 max-w-md w-full mx-4 text-center space-y-6">
        <div className="w-20 h-20 bg-[#5865f2] rounded-full flex items-center justify-center mx-auto">
          <span className="text-white text-3xl font-bold">FC</span>
        </div>
        <div>
          <h1 className="text-white text-2xl font-bold mb-2">
            You&apos;ve been invited to join a server
          </h1>
          <p className="text-[#b5bac1]">
            Click the button below to accept this invitation.
          </p>
        </div>

        {!isLoggedIn && (
          <div className="bg-[#1e1f22] rounded-lg p-4">
            <p className="text-[#f0b132] text-sm">
              You need to log in to accept this invite.
            </p>
          </div>
        )}

        <Button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-lg gap-2"
        >
          {isJoining ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Joining...
            </>
          ) : !isLoggedIn ? (
            <>
              <LogIn size={20} />
              Login to Join
            </>
          ) : (
            "Accept Invite"
          )}
        </Button>
      </div>
    </div>
  );
}
