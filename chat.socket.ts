import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import Message from '../models/Message.js';
import User from '../models/User.js';


interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  profileImage?: string;
}

export const setupWebSocket = (httpServer: Server) => {
  
  const wss = new WebSocketServer({ server: httpServer });

  
  wss.on('connection', async (ws: AuthenticatedWebSocket, req) => {
    try {
      
      const cookieHeader = req.headers.cookie;
      if (!cookieHeader) {
        ws.close(1008, 'Unauthorized - No cookies found');
        return;
      }

      
      const token = cookieHeader.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (!token) {
        ws.close(1008, 'Unauthorized - No token found');
        return;
      }

      
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        ws.close(1008, 'Unauthorized - User not found');
        return;
      }

      
      ws.userId = user._id.toString();
      ws.username = user.username;
      ws.profileImage = user.profileImage;

      
      const history = await Message.find()
        .sort({ timestamp: -1 })
        .limit(100)
        .populate('sender', 'username profileImage');
      
      ws.send(JSON.stringify({ type: 'history', data: history.reverse() }));

      //  האזנה להודעות חדשות שנשלחות מהלקוח
      ws.on('message', async (data) => {
        try {
          
          const parsedData = JSON.parse(data.toString());
          
          // יצירה ושמירה של ההודעה החדשה במסד הנתונים
          const newMessage = new Message({
            sender: ws.userId,
            content: parsedData.content
          });
          await newMessage.save();

         
          const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username profileImage');

          // שידור (Broadcast) ההודעה החדשה לכל הלקוחות המחוברים
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'newMessage', data: populatedMessage }));
            }
          });
        } catch (error) {
          
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to process message' }));
        }
      });

    } catch (error) {
      console.error('WebSocket Connection Error:', error);
      ws.close(1008, 'Invalid token');
    }
  });
};