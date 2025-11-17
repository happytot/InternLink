'use client';

import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // <-- adjust path if needed
import './messages.css';
import { formatDistanceToNow } from 'date-fns';

export default function MessagesPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // { id, email }
  const [profile, setProfile] = useState(null); // profile row (fullname/company_name/user_type)
  const [contacts, setContacts] = useState([]); // [{ id, displayName, user_type, avatar_url }]
  const [conversationsMeta, setConversationsMeta] = useState({}); // latest message per contact id
  const [selectedContact, setSelectedContact] = useState(null); // contact object
  const [messages, setMessages] = useState([]); // messages with selected contact
  const [newMessage, setNewMessage] = useState('');
  const [subscribed, setSubscribed] = useState(null);

  const scrollRef = useRef();

  // --- Helpers ---
  const contactDisplay = (p) => {
    if (!p) return 'Unknown';
    if (p.user_type === 'company') return p.company_name || p.fullname || 'Company';
    return p.fullname || p.company_name || 'User';
  };

  // --- Fetch current user & profile ---
  useEffect(() => {
    let authSub;
    const init = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setUser(currentUser);

      // fetch profile row
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, fullname, company_name, user_type, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();

      setProfile(prof || null);

      // load contacts & recent messages
      await loadContactsAndConversations(prof);

      // subscribe to auth changes (e.g. sign out)
      authSub = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session?.user) {
          setUser(null);
          setProfile(null);
        }
      });

      setLoading(false);
    };

    init();

    return () => {
      if (authSub?.subscription) authSub.subscription.unsubscribe();
    };
  }, []);

  // --- Load contacts + latest messages meta ---
  const loadContactsAndConversations = async (profRow) => {
    try {
      // Determine allowed contact user_types based on current user's user_type
      const userType = profRow?.user_type || null;

      let allowedTypes = [];
      if (userType === 'student' || userType === 'intern') {
        allowedTypes = ['company'];
      } else if (userType === 'company') {
        allowedTypes = ['student', 'coordinator', 'intern'];
      } else if (userType === 'coordinator') {
        allowedTypes = ['company'];
      } else {
        // fallback: allow company and student
        allowedTypes = ['company', 'student', 'coordinator', 'intern'];
      }

      // 1) Get all profiles matching allowedTypes (exclude self)
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, fullname, company_name, user_type, avatar_url')
        .in('user_type', allowedTypes)
        .neq('id', profRow?.id || '')
        .order('fullname', { ascending: true });

      if (profError) throw profError;

      const contactsList = (profData || []).map((p) => ({
        id: p.id,
        fullname: p.fullname,
        company_name: p.company_name,
        user_type: p.user_type,
        avatar_url: p.avatar_url || null,
        displayName: contactDisplay(p),
      }));

      setContacts(contactsList);

      // 2) Get latest messages involving current user (for unread / preview)
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('id, sender_id, receiver_id, message, created_at')
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order('created_at', { ascending: false })
        .limit(200); // limit for performance

      if (chatError) throw chatError;

      // build meta map: for each otherId store latest message
      const meta = {};
      (chatData || []).forEach((c) => {
        const otherId = c.sender_id === profile?.id ? c.receiver_id : c.sender_id;
        if (!otherId) return;
        if (!meta[otherId]) meta[otherId] = c;
      });

      setConversationsMeta(meta);

      // Set default selectedContact as the top contact by latest message or first contact
      const sortedOtherIds = Object.keys(meta);
      if (sortedOtherIds.length > 0) {
        const topOther = sortedOtherIds[0];
        const topContact = contactsList.find((c) => c.id === topOther) || contactsList[0];
        if (topContact) await selectContact(topContact);
      } else if (contactsList.length > 0) {
        await selectContact(contactsList[0]);
      }

      // subscribe to realtime chats
      subscribeToNewMessages(profile?.id);
    } catch (err) {
      console.error('Error loading contacts/conversations:', err);
    }
  };

  // --- Subscribe to new messages ---
  const subscribeToNewMessages = (currentProfileId) => {
    if (!currentProfileId) return;
    // Clean previous subscription if any
    if (subscribed) {
      try {
        supabase.removeChannel(subscribed);
      } catch (e) { /* ignore */ }
      setSubscribed(null);
    }

    // Use Realtime via PostgREST change feed (supabase v2 syntax)
    const channel = supabase.channel('public:chats')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chats' }, (payload) => {
        const msg = payload.new;
        // if message involves current user -> update conversation meta and messages if selected
        if (!profile) return;
        if (msg.sender_id === profile.id || msg.receiver_id === profile.id) {
          const otherId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;

          // update meta (latest message)
          setConversationsMeta((prev) => ({ ...prev, [otherId]: msg }));

          // if currently viewing this contact, append
          if (selectedContact && selectedContact.id === otherId) {
            setMessages((prev) => [...prev, msg]);
            // scroll after DOM update
            setTimeout(() => scrollToBottom(), 50);
          }
        }
      })
      .subscribe();

    setSubscribed(channel);
  };

  // --- Select contact and load messages ---
  const selectContact = async (contact) => {
    setSelectedContact(contact);
    setMessages([]);
    // fetch messages between current user/profile.id and contact.id
    try {
      const { data: msgs, error } = await supabase
        .from('chats')
        .select('id, sender_id, receiver_id, message, created_at')
        .or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${contact.id}),and(sender_id.eq.${contact.id},receiver_id.eq.${profile.id})`
        )
        .order('created_at', { ascending: true }); // oldest -> newest

      if (error) throw error;
      setMessages(msgs || []);
      // scroll to bottom after a tick
      setTimeout(() => scrollToBottom(), 80);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  // --- Send message ---
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
      // the realtime subscription will append the message for us
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  // --- utility to format time --
  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  // --- cleanup channel on unmount ---
  useEffect(() => {
    return () => {
      if (subscribed) {
        try {
          supabase.removeChannel(subscribed);
        } catch (e) { /* ignore */ }
      }
    };
  }, [subscribed]);

  // --- render ---
  if (loading) {
    return (
      <div className="messages-shell">
        <div className="messages-loading">Loading messages...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="messages-shell">
        <div className="messages-loggedout">
          You must be logged in to use messages.
        </div>
      </div>
    );
  }

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
              <div
                key={c.id}
                className={`contact-row ${selectedContact?.id === c.id ? 'active' : ''}`}
                onClick={() => selectContact(c)}
              >
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
          <div className="no-selection">
            Select a contact to start chatting
          </div>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
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
              <div
                key={c.id}
                className={`contact-row ${selectedContact?.id === c.id ? 'active' : ''}`}
                onClick={() => selectContact(c)}
              >
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
          <div className="no-selection">
            Select a contact to start chatting
          </div>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
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
