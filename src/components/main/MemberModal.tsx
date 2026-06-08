import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/shared/apiClient';
import { useTeamspaceStore } from '@/store/teamspaceStore';
import UserAvatar from '@/components/ui/UserAvatar';
import Button from '@/components/ui/Button';
import type { MemberInfo, PendingInvitation, InviteResponse } from '@/types/api';

interface MemberModalProps {
  isMemberModalOpen: boolean;
  toggleMemberModal: () => void;
}

export default function MemberModal({ isMemberModalOpen, toggleMemberModal }: MemberModalProps) {
  const { currentTeamspaceId } = useTeamspaceStore();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [email, setEmail] = useState('');

  const fetchMembers = useCallback(() => {
    if (!currentTeamspaceId) return;
    apiClient
      .get(`/api/teamspaces/${currentTeamspaceId}/members`)
      .then((res) => setMembers(res.data.data));
  }, [currentTeamspaceId]);

  useEffect(() => {
    if (isMemberModalOpen) fetchMembers();
  }, [isMemberModalOpen, fetchMembers]);

  const handleInvite = async () => {
    if (!email.trim() || !currentTeamspaceId) return;
    const res = await apiClient.post(`/api/teamspaces/${currentTeamspaceId}/members/invite`, {
      email: email.trim(),
    });
    const { invitationId } = res.data.data as InviteResponse;
    setPendingInvitations((prev) => [...prev, { invitationId, email: email.trim() }]);
    setEmail('');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!currentTeamspaceId) return;
    await apiClient.delete(`/api/teamspaces/${currentTeamspaceId}/members/${memberId}`);
    fetchMembers();
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!currentTeamspaceId) return;
    await apiClient.delete(`/api/teamspaces/${currentTeamspaceId}/invitations/${invitationId}`);
    setPendingInvitations((prev) => prev.filter((inv) => inv.invitationId !== invitationId));
  };

  if (!isMemberModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-999">
      <div className="bg-white rounded-2xl shadow-2xl w-125 p-6 flex flex-col gap-4 relative">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">멤버 관리</span>
          <Button variant="secondary" size="sm" onClick={toggleMemberModal}>
            닫기
          </Button>
        </div>

        <hr className="h-px border-none" />

        <div className="text-xs text-gray-500">멤버</div>
        <div className="flex flex-col gap-3">
          {members.map((member) => (
            <div key={member.userId} className="flex justify-between items-center">
              <div className="flex gap-3 items-center">
                <UserAvatar name={member.name} imageUrl={member.profileImageUrl} />
                <div>
                  <div className="font-medium text-sm">
                    {member.name}
                    {member.role === 'OWNER' && (
                      <span className="ml-1 text-xs text-primary">(방장)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{member.email}</div>
                </div>
              </div>

              {member.role !== 'OWNER' && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-red-500"
                  onClick={() => handleRemoveMember(String(member.userId))}
                >
                  추방
                </Button>
              )}
            </div>
          ))}
        </div>

        {pendingInvitations.length > 0 && (
          <>
            <div className="text-xs text-gray-500">초대 대기 중</div>
            <div className="flex flex-col gap-3">
              {pendingInvitations.map((inv) => (
                <div key={inv.invitationId} className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <UserAvatar name={inv.email} imageUrl={null} />
                    <div>
                      <div className="font-medium text-sm text-gray-400">초대 대기 중</div>
                      <div className="text-xs text-gray-500">{inv.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleCancelInvitation(inv.invitationId)}
                  >
                    초대 취소
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}

        <hr className="h-px border-none" />

        <div>
          <div className="text-xs text-gray-500 mb-2">새 멤버 초대</div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              placeholder="name@company.com"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 placeholder:text-gray-400 transition-all"
            />
            <Button variant="primary" size="sm" onClick={handleInvite}>
              초대 보내기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
