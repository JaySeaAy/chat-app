'use strict';

/**
 * ciudadano service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::ciudadano.ciudadano');
