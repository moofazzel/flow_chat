"use client";

import { Button } from "@/app/components/ui/button";
import {
  acceptInvite,
  getInviteByCode,
  validateInvite,
} from "@/lib/inviteService";
import { isServerMember } from "@/lib/membershipService";
import { getCurrentUser, User } from "@/utils/auth";
import { createClient } from "@/utils/supabase/client";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Home,
  Loader2,
  LogIn,
  Server,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ServerInfo {
  id: string;
  name: string;
  icon_url?: string;
  member_count?: number;
}

interface InviteStatus {
  loading: boolean;
  valid: boolean;
  error?: string;
  errorType?:
    | "expired"
    | "max_uses"
    | "not_found"
    | "already_member"
    | "unknown";
  serverInfo?: ServerInfo;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is logged in and validate invite
  useEffect(() => {
    async function checkInvite() {
      setCheckingAuth(true);
      const supabase = createClient();

      // Check authentication
      const user = await getCurrentUser();
      setCurrentUser(user);
      setCheckingAuth(false);

      if (!code) {
        setStatus({
          loading: false,
          valid: false,
          error: "Invalid invite link",
          errorType: "not_found",
          joined: false,
        });
        return;
      }

      try {
        // Get invite details first
        const invite = await getInviteByCode(code);

        if (!invite) {
          setStatus({
            loading: false,
            valid: false,
            error: "This invite link doesn't exist or has been deleted.",
            errorType: "not_found",
            joined: false,
          });
          return;
        }

        // Get server info
        const { data: server } = await supabase
          .from("servers")
          .select("id, name, icon_url")
          .eq("id", invite.server_id)
          .single();

        // Get member count
        const { count: memberCount } = await supabase
          .from("server_members")
          .select("*", { count: "exact", head: true })
          .eq("server_id", invite.server_id);

        const serverInfo: ServerInfo = {
          id: server?.id || invite.server_id,
          name: server?.name || "Unknown Server",
          icon_url: server?.icon_url,
          member_count: memberCount || 0,
        };

        // Validate the invite
        const validation = await validateInvite(code);

        if (!validation.valid) {
          let errorType: InviteStatus["errorType"] = "unknown";
          if (validation.reason?.includes("expired")) {
            errorType = "expired";
          } else if (validation.reason?.includes("maximum")) {
            errorType = "max_uses";
          }

          setStatus({
            loading: false,
            valid: false,
            error: validation.reason || "Invalid invite",
            errorType,
            serverInfo,
            joined: false,
          });
          return;
        }

        // If user is logged in, check if already a member
        if (user) {
          const alreadyMember = await isServerMember(invite.server_id, user.id);
          if (alreadyMember) {
            setStatus({
              loading: false,
              valid: false,
              error: "You're already a member of this server.",
              errorType: "already_member",
              serverInfo,
              serverId: invite.server_id,
              joined: false,
            });
            return;
          }
        }

        setStatus({
          loading: false,
          valid: true,
          serverInfo,
          joined: false,
        });
      } catch (error: unknown) {
        console.error("Error validating invite:", error);
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (
          errorMessage.includes("server_invites") ||
          errorMessage.includes("does not exist")
        ) {
          setStatus({
            loading: false,
            valid: false,
            error: "Invite system is not available.",
            errorType: "unknown",
            joined: false,
          });
        } else {
          setStatus({
            loading: false,
            valid: false,
            error: "Failed to validate invite. Please try again.",
            errorType: "unknown",
            joined: false,
          });
        }
      }
    }

    checkInvite();
  }, [code]);

  const handleJoin = async () => {
    if (!currentUser) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(`/invite/${code}`);
      router.push(`/?returnUrl=${returnUrl}`);
      return;
    }

    setIsJoining(true);
    try {
      const result = await acceptInvite(code);

      if (result.success) {
        setStatus((prev) => ({
          ...prev,
          loading: false,
          valid: true,
          joined: true,
          serverId: result.serverId,
          serverInfo: prev.serverInfo
            ? {
                ...prev.serverInfo,
                name: result.serverName || prev.serverInfo.name,
              }
            : undefined,
        }));
      } else {
        // Handle specific errors
        if (result.message.includes("already a member")) {
          setStatus((prev) => ({
            ...prev,
            loading: false,
            valid: false,
            error: "You're already a member of this server.",
            errorType: "already_member",
            serverId: result.serverId,
            joined: false,
          }));
        } else {
          setStatus((prev) => ({
            ...prev,
            loading: false,
            valid: false,
            error: result.message,
            joined: false,
          }));
        }
      }
    } catch (error) {
      console.error("Error accepting invite:", error);
      setStatus((prev) => ({
        ...prev,
        loading: false,
        valid: false,
        error: "Failed to join server. Please try again.",
        joined: false,
      }));
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

  const handleLogin = () => {
    const returnUrl = encodeURIComponent(`/invite/${code}`);
    router.push(`/?returnUrl=${returnUrl}`);
  };

  // Server icon component
  const ServerIcon = ({ server }: { server?: ServerInfo }) => {
    if (server?.icon_url) {
      return (
        <img
          src={server.icon_url}
          alt={server.name}
          className="w-20 h-20 rounded-2xl object-cover"
        />
      );
    }
    return (
      <div className="w-20 h-20 bg-gradient-to-br from-[#5865f2] to-[#7289da] rounded-2xl flex items-center justify-center">
        <span className="text-white text-2xl font-bold">
          {server?.name?.substring(0, 2).toUpperCase() || "FC"}
        </span>
      </div>
    );
  };

  // Loading state
  if (status.loading || checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#5865f2]/30 mx-auto" />
            <Loader2
              size={64}
              className="text-[#5865f2] animate-spin absolute top-0 left-1/2 -translate-x-1/2"
            />
          </div>
          <p className="text-[#b5bac1] text-lg">Validating invite...</p>
        </div>
      </div>
    );
  }

  // Successfully joined
  if (status.joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
            <CheckCircle
              size={72}
              className="text-green-500 mx-auto relative"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">Welcome!</h1>
            <p className="text-[#b5bac1]">
              You&apos;ve successfully joined{" "}
              <span className="text-white font-semibold">
                {status.serverInfo?.name || "the server"}
              </span>
            </p>
          </div>

          <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4">
            <ServerIcon server={status.serverInfo} />
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-lg">
                {status.serverInfo?.name || "Server"}
              </p>
              <p className="text-[#b5bac1] text-sm flex items-center gap-1">
                <Users size={14} />
                {(status.serverInfo?.member_count || 0) + 1} members
              </p>
            </div>
          </div>

          <Button
            onClick={handleGoToServer}
            className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-lg font-medium gap-2"
          >
            <Server size={20} />
            Go to Server
          </Button>
        </div>
      </div>
    );
  }

  // Already a member
  if (status.errorType === "already_member") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          <div className="relative">
            <div className="absolute inset-0 bg-[#5865f2]/20 rounded-full blur-xl" />
            <UserCheck size={72} className="text-[#5865f2] mx-auto relative" />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">Already a Member</h1>
            <p className="text-[#b5bac1]">
              You&apos;re already a member of{" "}
              <span className="text-white font-semibold">
                {status.serverInfo?.name || "this server"}
              </span>
            </p>
          </div>

          {status.serverInfo && (
            <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4">
              <ServerIcon server={status.serverInfo} />
              <div className="text-left flex-1">
                <p className="text-white font-semibold text-lg">
                  {status.serverInfo.name}
                </p>
                <p className="text-[#b5bac1] text-sm flex items-center gap-1">
                  <Users size={14} />
                  {status.serverInfo.member_count || 0} members
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleGoToServer}
              className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-lg font-medium gap-2"
            >
              <Server size={20} />
              Go to Server
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-[#4e5058] text-[#b5bac1] hover:bg-[#4e5058] hover:text-white h-10"
            >
              <Home size={18} className="mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Expired invite
  if (status.errorType === "expired") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          <div className="relative">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl" />
            <Clock size={72} className="text-yellow-500 mx-auto relative" />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">Invite Expired</h1>
            <p className="text-[#b5bac1]">
              This invite link has expired. Please ask for a new invite from a
              server member.
            </p>
          </div>

          {status.serverInfo && (
            <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4 opacity-60">
              <ServerIcon server={status.serverInfo} />
              <div className="text-left flex-1">
                <p className="text-white font-semibold text-lg">
                  {status.serverInfo.name}
                </p>
                <p className="text-[#b5bac1] text-sm">Invite expired</p>
              </div>
            </div>
          )}

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-[#4e5058] text-[#b5bac1] hover:bg-[#4e5058] hover:text-white h-12"
          >
            <Home size={18} className="mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Max uses reached
  if (status.errorType === "max_uses") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
            <AlertCircle
              size={72}
              className="text-orange-500 mx-auto relative"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">
              Invite Limit Reached
            </h1>
            <p className="text-[#b5bac1]">
              This invite link has reached its maximum number of uses. Please
              ask for a new invite.
            </p>
          </div>

          {status.serverInfo && (
            <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4 opacity-60">
              <ServerIcon server={status.serverInfo} />
              <div className="text-left flex-1">
                <p className="text-white font-semibold text-lg">
                  {status.serverInfo.name}
                </p>
                <p className="text-[#b5bac1] text-sm">Max uses reached</p>
              </div>
            </div>
          )}

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-[#4e5058] text-[#b5bac1] hover:bg-[#4e5058] hover:text-white h-12"
          >
            <Home size={18} className="mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Invalid/not found invite
  if (!status.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          <div className="relative">
            <div className="absolute inset-0 bg-[#ed4245]/20 rounded-full blur-xl" />
            <XCircle size={72} className="text-[#ed4245] mx-auto relative" />
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-2xl font-bold">Invalid Invite</h1>
            <p className="text-[#b5bac1]">
              {status.error ||
                "This invite link is invalid or has been deleted."}
            </p>
          </div>

          <div className="bg-[#1e1f22] rounded-xl p-4">
            <p className="text-[#80848e] text-sm">
              Make sure the link is correct, or ask for a new invite from a
              server member.
            </p>
          </div>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-[#4e5058] text-[#b5bac1] hover:bg-[#4e5058] hover:text-white h-12"
          >
            <Home size={18} className="mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Valid invite - Not logged in - Show professional auth prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
        <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
          {/* Server Icon with glow */}
          <div className="relative">
            <div className="absolute inset-0 bg-[#5865f2]/30 rounded-full blur-2xl scale-150" />
            <div className="relative mx-auto w-fit">
              <ServerIcon server={status.serverInfo} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#5865f2] rounded-full flex items-center justify-center">
                <Users size={12} className="text-white" />
              </div>
            </div>
          </div>

          {/* Invite Text */}
          <div className="space-y-2">
            <p className="text-[#b5bac1] text-sm uppercase tracking-wider font-medium">
              You&apos;ve been invited to join
            </p>
            <h1 className="text-white text-2xl font-bold">
              {status.serverInfo?.name || "a server"}
            </h1>
          </div>

          {/* Server Info Card */}
          {status.serverInfo && (
            <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4">
              <ServerIcon server={status.serverInfo} />
              <div className="text-left flex-1">
                <p className="text-white font-semibold text-lg">
                  {status.serverInfo.name}
                </p>
                <p className="text-[#b5bac1] text-sm flex items-center gap-1">
                  <Users size={14} />
                  <span className="text-green-400">●</span>
                  {status.serverInfo.member_count || 0} members
                </p>
              </div>
            </div>
          )}

          {/* Auth Required Section */}
          <div className="bg-gradient-to-br from-[#5865f2]/10 to-[#5865f2]/5 border border-[#5865f2]/30 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 bg-[#5865f2]/20 rounded-full flex items-center justify-center">
                <LogIn size={20} className="text-[#5865f2]" />
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Account Required</p>
                <p className="text-[#b5bac1] text-sm">
                  Sign in to accept this invite
                </p>
              </div>
            </div>

            <div className="border-t border-[#5865f2]/20 pt-4 space-y-3">
              {/* Login Button */}
              <Button
                onClick={handleLogin}
                className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-base font-medium gap-2"
              >
                <LogIn size={18} />
                Log In to Continue
              </Button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#4e5058]" />
                <span className="text-[#80848e] text-xs uppercase">or</span>
                <div className="flex-1 h-px bg-[#4e5058]" />
              </div>

              {/* Sign Up Button */}
              <Button
                onClick={handleLogin}
                variant="outline"
                className="w-full border-[#5865f2] text-[#5865f2] hover:bg-[#5865f2]/10 h-12 text-base font-medium gap-2"
              >
                <UserCheck size={18} />
                Create an Account
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-2 text-left">
            <p className="text-[#80848e] text-xs uppercase tracking-wider font-medium">
              What you&apos;ll get
            </p>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-[#b5bac1] text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span>
                  Join {status.serverInfo?.name || "the server"} instantly
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#b5bac1] text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span>Chat with other members in real-time</span>
              </div>
              <div className="flex items-center gap-2 text-[#b5bac1] text-sm">
                <CheckCircle size={14} className="text-green-500" />
                <span>Access shared boards and tasks</span>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-[#80848e] text-xs">
            By continuing, you agree to Flow Chat&apos;s Terms of Service and
            Privacy Policy
          </p>
        </div>
      </div>
    );
  }

  // Valid invite - Logged in - Show accept button
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#313338] to-[#1e1f22] flex items-center justify-center p-4">
      <div className="bg-[#2b2d31] rounded-2xl p-8 max-w-md w-full text-center space-y-6 shadow-xl border border-[#3f4147]/50">
        {/* Server Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-[#5865f2]/20 rounded-full blur-xl scale-150" />
          <div className="relative mx-auto w-fit">
            <ServerIcon server={status.serverInfo} />
          </div>
        </div>

        {/* Invite Text */}
        <div className="space-y-2">
          <p className="text-[#b5bac1] text-sm uppercase tracking-wider font-medium">
            You&apos;ve been invited to join
          </p>
          <h1 className="text-white text-2xl font-bold">
            {status.serverInfo?.name || "a server"}
          </h1>
        </div>

        {/* Server Info Card */}
        {status.serverInfo && (
          <div className="bg-[#1e1f22] rounded-xl p-4 flex items-center gap-4">
            <ServerIcon server={status.serverInfo} />
            <div className="text-left flex-1">
              <p className="text-white font-semibold text-lg">
                {status.serverInfo.name}
              </p>
              <p className="text-[#b5bac1] text-sm flex items-center gap-1">
                <Users size={14} />
                <span className="text-green-400">●</span>
                {status.serverInfo.member_count || 0} members
              </p>
            </div>
          </div>
        )}

        {/* Logged in user indicator */}
        <div className="bg-[#1e1f22] rounded-lg p-3 flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {currentUser?.full_name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="text-left">
            <p className="text-white text-sm font-medium">
              {currentUser?.full_name}
            </p>
            <p className="text-[#80848e] text-xs">Logged in</p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleJoin}
          disabled={isJoining}
          className="w-full bg-[#5865f2] hover:bg-[#4752c4] h-12 text-lg font-medium gap-2 disabled:opacity-50"
        >
          {isJoining ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Joining...
            </>
          ) : (
            <>
              <CheckCircle size={20} />
              Accept Invite
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
