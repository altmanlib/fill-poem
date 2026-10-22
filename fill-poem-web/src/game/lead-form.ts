export interface LeadForm {
  name: string;
  phone: string;
  address: string;
}

export type LeadErrors = Partial<Record<keyof LeadForm, string>>;

/** Validate the prize-delivery form; returns an empty object when valid. */
export function validateLead(form: LeadForm): LeadErrors {
  const errors: LeadErrors = {};
  if (!form.name.trim()) errors.name = '请填写姓名';
  if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) errors.phone = '请填写 11 位手机号';
  if (!form.address.trim()) errors.address = '请填写收货地址';
  return errors;
}
