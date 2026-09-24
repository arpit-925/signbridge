const User = require('../models/User');

class UserRepository {
  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+passwordHash +refreshToken');
    }
    return query.exec();
  }

  async findById(id, includePassword = false) {
    const query = User.findById(id);
    if (includePassword) {
      query.select('+passwordHash +refreshToken');
    }
    return query.exec();
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateById(id, updateData) {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).exec();
  }

  async setRefreshToken(id, refreshToken) {
    return User.findByIdAndUpdate(id, { refreshToken }, { new: true }).exec();
  }

  async findAll(filter = {}, pagination = { skip: 0, limit: 10 }, sort = { createdAt: -1 }) {
    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(pagination.skip).limit(pagination.limit).lean(),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }
}

module.exports = new UserRepository();
