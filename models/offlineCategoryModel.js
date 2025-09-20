import { getLocalDb, generateId, addTimestamps, resolveConflicts } from '@/lib/pouchdb';

class OfflineCategoryModel {
  constructor() {
    this.db = getLocalDb('categories');
  }

  async create(categoryData) {
    try {
      const category = {
        ...categoryData,
        _id: generateId('category'),
        type: 'category'
      };

      addTimestamps(category);
      
      const result = await this.db.put(category);
      return {
        success: true,
        category: {
          ...category,
          id: category._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return { success: false, error: error.message };
    }
  }

  async findAll(options = {}) {
    try {
      const { limit = 100, skip = 0 } = options;

      const result = await this.db.find({
        selector: { type: 'category' },
        limit,
        skip,
        sort: [{ name: 'asc' }]
      });

      const categories = result.docs.map(doc => ({
        ...doc,
        id: doc._id
      }));

      return { success: true, categories };
    } catch (error) {
      console.error('Error finding categories:', error);
      return { success: false, error: error.message };
    }
  }

  async findById(id) {
    try {
      const category = await this.db.get(id);
      return {
        success: true,
        category: {
          ...category,
          id: category._id
        }
      };
    } catch (error) {
      if (error.name === 'not_found') {
        return { success: false, error: 'Category not found' };
      }
      console.error('Error finding category:', error);
      return { success: false, error: error.message };
    }
  }

  async update(id, updateData) {
    try {
      const existingCategory = await this.db.get(id);
      
      const updatedCategory = {
        ...existingCategory,
        ...updateData,
        _id: id,
        _rev: existingCategory._rev
      };

      addTimestamps(updatedCategory, true);

      const result = await this.db.put(updatedCategory);
      
      return {
        success: true,
        category: {
          ...updatedCategory,
          id: updatedCategory._id,
          _rev: result.rev
        }
      };
    } catch (error) {
      if (error.name === 'conflict') {
        await resolveConflicts('categories', id, 'latest');
        return this.update(id, updateData);
      }
      
      console.error('Error updating category:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const category = await this.db.get(id);
      const result = await this.db.remove(category);
      
      return { success: true, result };
    } catch (error) {
      console.error('Error deleting category:', error);
      return { success: false, error: error.message };
    }
  }

  async resolveConflict(categoryId, strategy = 'latest') {
    try {
      const result = await resolveConflicts('categories', categoryId, strategy);
      return { success: true, result };
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfflineCategoryModel();
