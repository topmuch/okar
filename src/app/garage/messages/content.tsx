'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MessageSquare,
  Send,
  Inbox,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronRight,
  Loader2,
  Plus
} from 'lucide-react';

interface Message {
  id: string;
  type: string;
  status: string;
  subject: string | null;
  content: string;
  createdAt: string;
  senderName?: string;
  recipientName?: string;
}

export default function GarageMessagesContent() {
  const searchParams = useSearchParams();
  const messageType = searchParams.get('type') || 'inbox';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
  });
  const [sending, setSending] = useState(false);

  // Garage ID (would come from auth)
  const garageId = 'demo-garage-id';

  useEffect(() => {
    fetchMessages();
  }, [messageType]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages?garageId=${garageId}&type=${messageType}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'commande_garage': return 'Commande QR';
      case 'assistance_garage': return 'Assistance';
      case 'reponse_assistance': return 'Réponse';
      case 'message_superadmin': return 'Message Admin';
      default: return 'Message';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'non_lu':
        return { label: 'Non lu', className: 'bg-blue-100 text-blue-700', icon: Clock };
      case 'lu':
        return { label: 'Lu', className: 'bg-slate-100 text-slate-600', icon: CheckCircle };
      case 'traite':
        return { label: 'Traité', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle };
      default:
        return { label: status, className: 'bg-slate-100 text-slate-600', icon: Clock };
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.subject || !newMessage.content) return;
    
    setSending(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'assistance_garage',
          garageId,
          subject: newMessage.subject,
          content: newMessage.content,
        }),
      });

      if (response.ok) {
        setNewMessageOpen(false);
        setNewMessage({ subject: '', content: '' });
        fetchMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-orange-500" />
            Messages
          </h1>
          <p className="text-slate-500 mt-1">
            Communication avec le support AutoPass
          </p>
        </div>
        <button
          onClick={() => setNewMessageOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau message
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['inbox', 'sent', 'support'].map((tab) => (
          <Link
            key={tab}
            href={`/garage/messages?type=${tab}`}
            className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap ${
              messageType === tab
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab === 'inbox' ? 'Boîte de réception' : tab === 'sent' ? 'Envoyés' : 'Support'}
          </Link>
        ))}
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <Inbox className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">Aucun message</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {messages.map((message) => {
            const statusConfig = getStatusConfig(message.status);
            return (
              <button
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${message.status === 'non_lu' ? 'bg-blue-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-orange-500">
                        {getTypeLabel(message.type)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.className}`}>
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-white truncate">
                      {message.subject || 'Sans objet'}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {message.content.substring(0, 100)}...
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                {selectedMessage.subject || 'Sans objet'}
              </h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-orange-500 font-medium">{getTypeLabel(selectedMessage.type)}</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{formatDate(selectedMessage.createdAt)}</span>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {selectedMessage.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {newMessageOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">
                Nouveau message
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Objet
                </label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  placeholder="Objet de votre message"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  rows={5}
                  placeholder="Votre message..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setNewMessageOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending || !newMessage.subject || !newMessage.content}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Envoyer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
