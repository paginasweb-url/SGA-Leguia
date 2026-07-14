import {
  getNotificationsForUser,
  markNotificationAsReadByUser
} from '../services/notifications.service.js';

export const getMyNotifications = async (req, res) => {
  try {
    const { limit } = req.query;

    const notifications = await getNotificationsForUser({
      userId: req.user.id,
      limit
    });

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const markMyNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await markNotificationAsReadByUser({
      id,
      userId: req.user.id
    });

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
      data: notification
    });

  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};