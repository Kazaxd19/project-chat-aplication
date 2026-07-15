export interface Message {
  sender: string;
  username: string;
  profileImage: string;
  content: string;
  timestamp: string | Date;
}