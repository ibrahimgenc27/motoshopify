/**
 * useChat Hook - Chat WebSocket bağlantısı ve state yönetimi
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Types
export interface ChatMessage {
    id: string;
    chatSessionId: string;
    sender: 'USER' | 'BOT' | 'AGENT';
    content: string;
    messageType: 'text' | 'product_card' | 'order_info' | 'quick_reply';
    metadata?: {
        products?: any[];
        order?: any;
        quickReplies?: string[];
    };
    isRead: boolean;
    createdAt: string;
}

export interface ChatSession {
    id: string;
    sessionId: string;
    userId: number | null;
    status: 'BOT_MODE' | 'WAITING_FOR_AGENT' | 'AGENT_MODE' | 'CLOSED';
    agentId: number | null;
    customerName: string | null;
    customerEmail: string | null;
    category: string | null;
    createdAt: string;
    updatedAt: string;
}

interface UseChatOptions {
    sessionId: string;
    customerName?: string;
    customerEmail?: string;
    category?: string;
    enabled?: boolean; // Lazy initialization
}

export function useChat({ sessionId, customerName, customerEmail, category, enabled = true }: UseChatOptions) {
    const [chatSession, setChatSession] = useState<ChatSession | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const chatSessionRef = useRef<ChatSession | null>(null);

    // Keep ref in sync with state
    useEffect(() => {
        chatSessionRef.current = chatSession;
    }, [chatSession]);

    // Connect to WebSocket
    const connect = useCallback((session: ChatSession) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        console.log('[Chat] Connecting to WebSocket...');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

        ws.onopen = () => {
            console.log('[Chat] WebSocket connected');
            setIsConnected(true);

            // Join the session
            ws.send(JSON.stringify({
                type: 'join_session',
                chatSessionId: session.id,
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Chat] Message received:', data.type);

                switch (data.type) {
                    case 'new_message':
                        setMessages(prev => [...prev, data.message]);
                        break;

                    case 'bot_typing':
                        setIsBotTyping(data.isTyping);
                        break;

                    case 'agent_joined':
                        setChatSession(prev => prev ? { ...prev, status: 'AGENT_MODE', agentId: data.agentId } : null);
                        break;

                    case 'status_changed':
                        setChatSession(prev => prev ? { ...prev, status: data.status } : null);
                        break;

                    case 'session_closed':
                        setChatSession(prev => prev ? { ...prev, status: 'CLOSED' } : null);
                        break;
                }
            } catch (e) {
                console.error('[Chat] Failed to parse message:', e);
            }
        };

        ws.onclose = () => {
            console.log('[Chat] WebSocket disconnected');
            setIsConnected(false);

            // Reconnect after 3 seconds if session still active
            reconnectTimeoutRef.current = setTimeout(() => {
                const currentSession = chatSessionRef.current;
                if (currentSession && currentSession.status !== 'CLOSED') {
                    connect(currentSession);
                }
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error('[Chat] WebSocket error:', err);
        };

        wsRef.current = ws;
    }, []);

    // Initialize chat session
    const initializeSession = useCallback(async () => {
        if (isInitialized || isLoading) return null;

        try {
            setIsLoading(true);
            setError(null);
            console.log('[Chat] Initializing session...');

            const response = await fetch('/api/chat/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, customerName, customerEmail, category }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Chat oturumu başlatılamadı');
            }

            const data = await response.json();
            console.log('[Chat] Session created:', data.session?.id);

            setChatSession(data.session);
            setMessages(data.messages || []);
            setIsInitialized(true);

            // Connect to WebSocket after session is created
            if (data.session) {
                connect(data.session);
            }

            return data.session;
        } catch (err) {
            console.error('[Chat] Init error:', err);
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [sessionId, customerName, customerEmail, category, isInitialized, isLoading, connect]);

    // Send message
    const sendMessage = useCallback((content: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.error('[Chat] Cannot send: WebSocket not connected');
            return false;
        }

        if (!chatSessionRef.current) {
            console.error('[Chat] Cannot send: No active session');
            return false;
        }

        wsRef.current.send(JSON.stringify({
            type: 'send_message',
            sender: 'USER',
            content,
        }));
        return true;
    }, []);

    // Request live agent
    const requestAgent = useCallback(async () => {
        const session = chatSessionRef.current;
        if (!session) return;

        try {
            await fetch('/api/chat/request-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatSessionId: session.id }),
            });
        } catch (err) {
            console.error('[Chat] Request agent error:', err);
        }
    }, []);

    // Initialize when enabled
    useEffect(() => {
        if (enabled && !isInitialized && !isLoading) {
            initializeSession();
        }
    }, [enabled, isInitialized, isLoading, initializeSession]);

    // Reset state when sessionId changes
    useEffect(() => {
        setChatSession(null);
        setMessages([]);
        setIsConnected(false);
        setIsInitialized(false);
        setIsLoading(false);
        setError(null);

        // Close existing connection
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, [sessionId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return {
        chatSession,
        messages,
        isConnected,
        isBotTyping,
        isLoading,
        error,
        isInitialized,
        sendMessage,
        requestAgent,
        initializeSession,
    };
}
