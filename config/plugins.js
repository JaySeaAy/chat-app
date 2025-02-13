module.exports = ({ env }) => ({
  io: {
		enabled: true,
		config: {
			contentTypes: ['api::article.article'],
      socket: {
				serverOptions: {
					cors: { origin: 'http://localhost:1337', methods: ['GET', 'POST'] },
				},
			},
			events: [
				{
					name: 'connection',
					handler: ({ strapi }, socket) => {
						strapi.log.info(`[io] a new client with id ${socket.id} has connected`);
					},
				},
			],
		},
	},
  'users-permissions': {
    config: {
      allowedFields: ['username', 'email', 'password'], 
    },
  },
});
