import Plan from "../models/plan.model";

class PlanService {
  async getAll(estado?: string) {
    if (estado) {
      return await Plan.find({ estado });
    }
    return await Plan.find();
  }

  async getActive() {
    return await Plan.find({ estado: "activo" }).sort({ popular: -1 });
  }

  async create(data: any) {
    const plan = new Plan(data);
    await plan.save();
    return plan;
  }

  async update(id: string, data: any) {
    return await Plan.findByIdAndUpdate(id, data, { new: true });
  }

  async deactivate(id: string) {
    return await Plan.findByIdAndUpdate(
      id,
      { estado: "inactivo" },
      { new: true }
    );
  }
}

export default new PlanService();
