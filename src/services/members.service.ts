import Member, { IMember } from '../models/member.model';

import { MemberDTO } from '../models/member';

export async function listMembers(page = 1, limit = 10, filtersOrQ: any = {}) {
  const skip = (page - 1) * limit;
  let query: any = {};
  if (typeof filtersOrQ === 'string' && filtersOrQ.trim()) {
    const q = filtersOrQ.trim();
    query = { $or: [{ nombre: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] };
  } else if (typeof filtersOrQ === 'object') {
    query = { ...filtersOrQ };
  }
  const [data, total] = await Promise.all([
    Member.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
    Member.countDocuments(query)
  ]);
  return { data, total };
};

export async function createMember(payload: MemberDTO) {
  const doc = new Member(payload);
  return doc.save();
};

export async function updateMember(id: string, payload: Partial<MemberDTO>) {
  return Member.findByIdAndUpdate(id, payload, { new: true }).lean();
};

export async function deleteMember(id: string) {
  return Member.findByIdAndDelete(id).lean();
};
