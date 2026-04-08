/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorEnvelope:
 *       type: object
 *       required:
 *         - ok
 *         - error
 *         - request_id
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         request_id:
 *           type: string
 *           example: req_01HXYZABC123
 *         error:
 *           type: object
 *           required:
 *             - code
 *             - message
 *           properties:
 *             code:
 *               type: string
 *               example: unauthorized
 *             message:
 *               type: string
 *               example: Missing or invalid x-api-key header.
 *             details:
 *               type: object
 *               additionalProperties: true
 */
