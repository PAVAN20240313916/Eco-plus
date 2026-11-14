import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, "Organization or establishment name must be at least 2 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessType: z.string().min(2, "Business type is required")
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required")
});

export const inventorySchema = z.object({
  itemName: z.string().min(2, "Item name is required"),
  category: z.string().min(2, "Category is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  costPerUnit: z.coerce.number().positive("Cost must be positive"),
  expirationDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date")
});

export const wasteLogSchema = z.object({
  itemName: z.string().min(2, "Item name is required"),
  quantityWasted: z.coerce.number().positive("Quantity wasted must be greater than zero"),
  unit: z.string().min(1, "Unit is required"),
  reason: z.string().min(2, "Reason is required"),
  financialLoss: z.coerce.number().nonnegative("Financial loss must be non-negative"),
  carbonImpact: z.coerce.number().nonnegative("Carbon impact must be non-negative"),
  logDate: z.string().optional()
});

export const surplusSchema = z.object({
  itemName: z.string().min(2, "Item name is required"),
  category: z.string().default("Produce"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unit: z.string().default("kg"),
  expirationDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  matchedPartner: z.string().optional(),
  partnerType: z.string().optional(),
  pickupWindow: z.string().optional()
});
