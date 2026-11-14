import { db } from '../config/db.js';

export async function getInventory(req, res) {
  try {
    const items = await db.getInventory(req.orgId);
    return res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    console.error('[Inventory] Fetch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve inventory items.' });
  }
}

export async function addInventory(req, res) {
  try {
    const { itemName, category, quantity, unit, costPerUnit, expirationDate } = req.body;
    const newItem = await db.addInventory(req.orgId, {
      itemName,
      category,
      quantity,
      unit,
      costPerUnit,
      expirationDate
    });

    return res.status(201).json({
      success: true,
      message: 'Inventory item added successfully.',
      data: newItem
    });
  } catch (err) {
    console.error('[Inventory] Create error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create inventory item.' });
  }
}

export async function updateInventory(req, res) {
  try {
    const { id } = req.params;
    const updated = await db.updateInventory(req.orgId, id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Inventory item not found.' });
    }
    return res.json({
      success: true,
      message: 'Inventory item updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('[Inventory] Update error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update inventory item.' });
  }
}

export async function deleteInventory(req, res) {
  try {
    const { id } = req.params;
    const deleted = await db.deleteInventory(req.orgId, id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Inventory item not found or already deleted.' });
    }
    return res.json({
      success: true,
      message: 'Inventory item deleted successfully.'
    });
  } catch (err) {
    console.error('[Inventory] Delete error:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete inventory item.' });
  }
}
