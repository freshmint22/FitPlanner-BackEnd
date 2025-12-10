import Member from '../models/member.model';
import { MemberDTO } from '../models/member';

/**
 * Listar miembros con paginación y filtros.
 */
export async function listMembers(
  page = 1,
  limit = 10,
  filtersOrQ: string | Record<string, unknown> = {}
) {
  const skip = (page - 1) * limit;
  let query: Record<string, unknown> = {};

  if (typeof filtersOrQ === 'string' && filtersOrQ.trim()) {
    const q = filtersOrQ.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    query = {
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    };
  } else if (typeof filtersOrQ === 'object') {
    query = { ...filtersOrQ };
  }

  const [data, total] = await Promise.all([
    Member.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),

    Member.countDocuments(query)
  ]);

  return { data, total };
}

/**
 * Crear miembro nuevo.
 */
export async function createMember(payload: MemberDTO) {
  const doc = new Member(payload);
  return doc.save();
}

/**
 * Actualizar datos de un miembro (HU-19: Editar Perfil)
 */
export async function updateMember(id: string, payload: Partial<MemberDTO>) {
  const updated = await Member.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true
  }).lean();

  if (!updated) {
    throw new Error("Usuario no encontrado");
  }

  return updated;
}

/**
 * Eliminar un miembro.
 */
export async function deleteMember(id: string) {
  return Member.findByIdAndDelete(id).lean();
}
