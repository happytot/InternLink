'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import './messages.css';
import { formatDistanceToNow } from 'date-fns';
import InternNav from '../../components/InternNav';

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [conversationsMeta, setConversationsMeta] = useState({});
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [subscribed, setSubscribed] = useState(null);

  const scrollRef = useRef();

  const contactDisplay = (p) => {
    if (!p) return 'Unknown';
    if (p.user_type === 'company') return p.company_name || p.fullname || 'Company';
    return p.fullname || p.company_name || 'User';
  };

  useEffect(() => {
    let authSub;
    const init = async () => {
      setLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;

      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('id, fullname, company_name, user_type')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (profError) console.error('Error fetching profile:', profError);
      if (!prof) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(prof);
      await loadContactsAndConversations(prof);

      authSub = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setUser(null);
          setProfile(null);
        } else {
          setUser(session.user);
        }
      });

      setLoading(false);
    };

    init();

    return () => {
      if (authSub?.subscription) authSub.subscription.unsubscribe();
    };
  }, []);

  const loadContactsAndConversations = async (profRow) => {
    try {
      const userType = profRow?.user_type || null;
      let allowedTypes = [];
      if (userType === 'student' || userType === 'intern') allowedTypes = ['company'];
      else if (userType === 'company') allowedTypes = ['student', 'coordinator', 'intern'];
      else if (userType === 'coordinator') allowedTypes = ['company'];
      else allowedTypes = ['company', 'student', 'coordinator', 'intern'];

      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, fullname, company_name, user_type')
        .in('user_type', allowedTypes)
        .neq('id', profRow?.id || '')
        .order('fullname', { ascending: true });

      if (profError) throw profError;

      const contactsList = (profData || []).map((p) => ({
        id: p.id,
        fullname: p.fullname,
        company_name: p.company_name,
        user_type: p.user_type,
        displayName: contactDisplay(p),
      }));

      setContacts(contactsList);

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id, sender_id, receiver_id, message, created_at')
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (chatError) throw chatError;

      const meta = {};
      (chatData || []).forEach((c) => {
        const otherId = c.sender_id === profile?.id ? c.receiver_id : c.sender_id;
        if (!otherId) return;
        if (!meta[otherId]) meta[otherId] = c;
      });

      setConversationsMeta(meta);

      const sortedOtherIds = Object.keys(meta);
      if (sortedOtherIds.length > 0) {
        const topOther = sortedOtherIds[0];
        const topContact = contactsList.find((c) => c.id === topOther) || contactsList[0];
        if (topContact) await selectContact(topContact);
      } else if (contactsList.length > 0) {
        await selectContact(contactsList[0]);
      }

      subscribeToNewMessages(profile?.id);
    } catch (err) {
      console.error('Error loading contacts/conversations:', err);
    }
  };

  const subscribeToNewMessages = (currentProfileId) => {
    if (!currentProfileId) return;
    if (subscribed) {
      try { supabase.removeChannel(subscribed); } catch (e) {}
      setSubscribed(null);
    }

    const channel = supabase.channel('public:chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        const msg = payload.new;
        if (!profile) return;
        if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
          const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
          setConversationsMeta((prev) => ({ ...prev, [otherId]: msg }));
          if (selectedContact && selectedContact.id === otherId) {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => scrollToBottom(), 50);
          }
        }
      })
      .subscribe();

    setSubscribed(channel);
  };

  const selectContact = async (contact) => {
    setSelectedContact(contact);
    setMessages([]);
    try {
      const { data: msgs, error } = await supabase
        .from('chats')
        .select('id, sender_id, receiver_id, message, created_at')
        .or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${profile.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(msgs || []);
      setTimeout(() => scrollToBottom(), 80);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    if (!profile || !selectedContact) return;
    const payload = {
      sender_id: profile.id,
      receiver_id: selectedContact.id,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };
    try {
      const { error } = await supabase.from('chats').insert([payload]);
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
    catch { return ''; }
  };

  useEffect(() => {
    return () => { if (subscribed) { try { supabase.removeChannel(subscribed); } catch {} } };
  }, [subscribed]);

  if (loading) return <div className="messages-shell"><div className="messages-loading">Loading messages...</div></div>;
  if (!user || !profile) return <div className="messages-shell"><div className="messages-loggedout">You must be logged in to use messages.</div></div>;

  return (
    <div className="messages-shell">
      <aside className="messages-left">
        <div className="messages-left-header">
          <h3>Chats</h3>
          <div className="my-profile">
            <div className="avatar placeholder">{(profile.fullname || profile.company_name || '').slice(0,2)}</div>
            <div className="my-info">
              <div className="my-name">{contactDisplay(profile)}</div>
              <div className="my-role">{profile.user_type}</div>
            </div>
          </div>
        </div>

        <div className="contacts-list">
          {contacts.length === 0 && <div className="no-contacts">No contacts available.</div>}
          {contacts.map((c) => {
            const meta = conversationsMeta[c.id];
            return (
              <div key={c.id} className={`contact-row ${selectedContact?.id === c.id ? 'active' : ''}`} onClick={() => selectContact(c)}>
                <div className="contact-avatar">{(c.fullname || c.company_name || '').slice(0,2)}</div>
                <div className="contact-body">
                  <div className="contact-top">
                    <div className="contact-name">{contactDisplay(c)}</div>
                    <div className="contact-time">{meta?.created_at ? timeAgo(meta.created_at) : ''}</div>
                  </div>
                  <div className="contact-bottom">
                    <div className="contact-preview">{meta?.message ? (meta.message.length > 50 ? meta.message.slice(0,47)+'...' : meta.message) : ''}</div>
                    <div className="contact-role">{c.user_type}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="messages-right">
        {!selectedContact ? (
          <div className="no-selection">Select a contact to start chatting</div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-title">
                <div className="avatar placeholder">{(selectedContact.fullname || selectedContact.company_name || '').slice(0,2)}</div>
                <div>
                  <div className="chat-name">{contactDisplay(selectedContact)}</div>
                  <div className="chat-sub">{selectedContact.user_type}</div>
                </div>
              </div>
            </div>

            <div className="chat-body" ref={scrollRef}>
              {messages.length === 0 && <div className="empty-chat">No messages yet. Say hello 👋</div>}
              {messages.map((m) => {
                const mine = m.sender_id === profile.id;
                return (
                  <div key={m.id} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                    <div className="msg-bubble">
                      <div className="msg-text">{m.message}</div>
                      <div className="msg-meta">{timeAgo(m.created_at)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="chat-input">
              <textarea
                placeholder={`Message ${contactDisplay(selectedContact)}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              />
              <div className="chat-actions">
                <button className="btn-send" onClick={handleSend} disabled={!newMessage.trim()}>Send</button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
