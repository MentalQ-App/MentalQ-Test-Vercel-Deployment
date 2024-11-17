const Users = require('./users');
const UserSessions = require('./user_sessions');
const Notes = require('./notes');
const Credentials = require('./credentials');

Users.belongsTo(Credentials, { as : 'credentials', foreignKey: 'credentials_id' });
Users.hasMany(Notes, { as: 'notes' , foreignKey: 'note_id' });
UserSessions.belongsTo(Users,{ as: 'users' , foreignKey: 'user_id' });

module.exports = {
    Users,
    UserSessions,
    Notes,
    Credentials
};