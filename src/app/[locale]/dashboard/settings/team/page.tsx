"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/ToastProvider";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Skeleton, { SkeletonCard } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";

interface Member {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
}

interface Owner {
  id: string;
  email: string;
  name: string | null;
}

export default function TeamPage() {
  const t = useTranslations("team");
  const tModal = useTranslations("modal");
  const toast = useToast();

  const [owner, setOwner] = useState<Owner | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [planAllowed, setPlanAllowed] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((me) => {
        setCurrentUserId(me.id);
        if (me.plan !== "BUSINESS") {
          setPlanAllowed(false);
          setLoaded(true);
          return;
        }
        if (me.restaurantId) {
          setRestaurantId(me.restaurantId);
          return fetch(`/api/restaurants/${me.restaurantId}/team`);
        }
        throw new Error("No restaurant");
      })
      .then((r) => {
        if (!r) return;
        return r.json();
      })
      .then((data) => {
        if (data) {
          setOwner(data.owner);
          setMembers(data.members || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const handleInvite = async () => {
    if (!restaurantId || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.status === 403) {
        toast.error(t("limitReached"));
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error === "USER_NOT_FOUND" ? "User not found" : t("inviteError"));
        return;
      }
      const data = await res.json();
      setMembers((prev) => [...prev, data.member]);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("MEMBER");
    } catch {
      toast.error(t("inviteError"));
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: "ADMIN" | "MEMBER") => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/team/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role } : m))
        );
      } else {
        toast.error(t("updateError"));
      }
    } catch {
      toast.error(t("updateError"));
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/team/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        toast.error(t("removeError"));
      }
    } catch {
      toast.error(t("removeError"));
    } finally {
      setRemoveId(null);
    }
  };

  if (!loaded) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!planAllowed) {
    return (
      <div className="text-center py-16 space-y-4">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted">{t("requiresBusiness")}</p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius-button)] text-sm font-medium hover:opacity-90"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted text-sm mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>{t("invite")}</Button>
      </div>

      <div className="space-y-3">
        {/* Owner card */}
        {owner && (
          <div className="bg-card border border-border rounded-[var(--radius-card)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                {(owner.name || owner.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {owner.name || owner.email}
                  {owner.id === currentUserId && (
                    <span className="text-muted text-sm ml-1">{t("you")}</span>
                  )}
                </p>
                <p className="text-sm text-muted">{owner.email}</p>
              </div>
            </div>
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              {t("roles.OWNER")}
            </span>
          </div>
        )}

        {/* Team members */}
        {members.map((member) => (
          <div
            key={member.id}
            className="bg-card border border-border rounded-[var(--radius-card)] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-sm font-medium">
                {(member.name || member.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">
                  {member.name || member.email}
                  {member.userId === currentUserId && (
                    <span className="text-muted text-sm ml-1">{t("you")}</span>
                  )}
                </p>
                <p className="text-sm text-muted">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value as "ADMIN" | "MEMBER")}
                className="text-sm bg-background border border-border rounded-[var(--radius-button)] px-2 py-1 focus:outline-none"
              >
                <option value="ADMIN">{t("roles.ADMIN")}</option>
                <option value="MEMBER">{t("roles.MEMBER")}</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRemoveId(member.id)}
                className="text-sentiment-negative hover:text-sentiment-negative"
              >
                {t("remove")}
              </Button>
            </div>
          </div>
        ))}

        {members.length === 0 && !owner && (
          <div className="text-center py-12 text-muted">
            <p>{t("empty")}</p>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t("invite")}</h2>

          <div>
            <label className="block text-sm font-medium mb-1">{t("email")}</label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t("role")}</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-[var(--radius-button)] text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="MEMBER">{t("roles.MEMBER")}</option>
              <option value="ADMIN">{t("roles.ADMIN")}</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              {tModal("cancel")}
            </Button>
            <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? t("inviting") : t("inviteButton")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeId}
        onConfirm={() => removeId && handleRemove(removeId)}
        onCancel={() => setRemoveId(null)}
        title={t("remove")}
        message={t("removeConfirm")}
        confirmLabel={tModal("delete")}
        cancelLabel={tModal("cancel")}
        variant="danger"
      />
    </div>
  );
}
