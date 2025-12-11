import Member from "../models/member.model";
import { createSimulatedPayment } from "./payments.service";

/**
 * Listar miembros con paginación y búsqueda
 */
export const listMembers = async (page: number, limit: number, q?: string) => {
  const query = q
    ? {
        $or: [
          { firstName: new RegExp(q, "i") },
          { lastName: new RegExp(q, "i") },
          { email: new RegExp(q, "i") },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    Member.find(query)
      .skip((page - 1) * limit)
      .limit(limit),
    Member.countDocuments(query),
  ]);

  return { data, total };
};

/**
 * Crear miembro
 */
export const createMember = async (memberData: any) => {
  const newMember = new Member(memberData);
  await newMember.save();
  return newMember;
};

/**
 * Actualizar datos básicos del perfil
 */
export const updateMember = async (id: string, updateData: any) => {
  const updated = await Member.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  return updated;
};

/**
 * Eliminar miembro
 */
export const deleteMember = async (id: string) => {
  await Member.findByIdAndDelete(id);
};

/**
 * Actualizar membresía + registrar pago
 */
export const updateMembership = async (
  memberId: string,
  membershipData: {
    name: string;
    price: number;
    duration: number;
  }
) => {
  const member = await Member.findById(memberId);
  if (!member) throw new Error("Miembro no encontrado");

  // fechas
  const startDate = new Date();
  const endDate = new Date(
    startDate.getTime() + membershipData.duration * 24 * 60 * 60 * 1000
  );

  // actualizar membresía
  member.membership = {
    name: membershipData.name,
    price: membershipData.price,
    duration: membershipData.duration,
    startDate,
    endDate,
  };

  await member.save();

  // registrar pago
  await createSimulatedPayment({
    memberId: member._id.toString(),
    amount: membershipData.price,
  });

  return member;
};
