// ==================== 公共函数（唯一，供所有页面使用） ====================

// ---- 全局标志，防止重复初始化轮询 ----
if (window._commonLoaded) {
  console.warn("common.js 已加载，跳过重复执行");
} else {
  window._commonLoaded = true;

  // ---------- Toast ----------
  window.showToast = function (message, duration = 2000) {
    const existingToast = document.querySelector(".toast-message");
    if (existingToast) existingToast.remove();
    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, duration);
  };

  // 辅助：获取有效的头像URL（无效则生成 Gravatar）
  window.getValidAvatarUrl = function (avatarUrl, email) {
    if (
      !avatarUrl ||
      avatarUrl ===
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp" ||
      avatarUrl.includes("gravatar.com/avatar/00000")
    ) {
      const emailMd5 = md5 ? md5((email || "").trim().toLowerCase()) : "";
      if (emailMd5)
        return `https://www.gravatar.com/avatar/${emailMd5}?d=mp&s=200`;
      return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
    }
    return avatarUrl;
  };

  // 辅助：头像加载失败时的回退
  window.handleAvatarError = function (imgElement, email) {
    if (imgElement.src.includes("gravatar.com")) return; // 防止无限循环
    const validUrl = getValidAvatarUrl(null, email);
    imgElement.src = validUrl;
    imgElement.onerror = null; // 避免重复触发
  };

  // ---------- 带 session 的 fetch ----------
  window.authFetch = async function (url, options = {}) {
    options.credentials = "include";
    if (options.body && typeof options.body === "object") {
      options.body = JSON.stringify(options.body);
      options.headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };
    }
    return fetch(url, options);
  };

  // ---------- HTML 转义 ----------
  window.escapeHtml = function (str) {
    if (!str) return "";
    return String(str).replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  };

  // ---------- 自定义模态框 ----------
  window.showCustomModal = function (options) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 200000;
            `;
      const box = document.createElement("div");
      box.style.cssText = `
                background: #1a1a1a;
                border: 2px solid #ffd700;
                border-radius: 20px;
                padding: 20px;
                max-width: 90%;
                width: 300px;
                text-align: center;
                box-shadow: 0 0 20px rgba(255,215,0,0.3);
            `;
      box.innerHTML = `
                <div style="color:#ffd700; font-size:1.2rem; margin-bottom:15px;">${options.title || "提示"}</div>
                <div style="color:#fff; margin-bottom:20px;">${options.message}</div>
                <div style="display:flex; gap:15px; justify-content:center;">
                    ${options.showCancel !== false ? `<button id="modalCancel" style="background:#444; color:#fff; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">取消</button>` : ""}
                    <button id="modalConfirm" style="background:#ffd700; color:#000; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">${options.confirmText || "确定"}</button>
                </div>
            `;
      modal.appendChild(box);
      document.body.appendChild(modal);
      const confirmBtn = box.querySelector("#modalConfirm");
      const cancelBtn = box.querySelector("#modalCancel");
      confirmBtn.onclick = () => {
        modal.remove();
        resolve(true);
      };
      if (cancelBtn)
        cancelBtn.onclick = () => {
          modal.remove();
          resolve(false);
        };
      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };
    });
  };

  // ---------- 获取用户头像（带缓存） ----------
  let avatarCache = {};
  window.getUserAvatar = async function (email) {
    if (avatarCache[email]) return avatarCache[email];
    try {
      const res = await fetch(`/api/user/info/${encodeURIComponent(email)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const user = await res.json();
        let avatarUrl = user.avatar;
        // 如果服务器返回的是默认图片，则使用 Gravatar
        if (
          !avatarUrl ||
          avatarUrl ===
            "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"
        ) {
          const emailMd5 = md5 ? md5(email.trim().toLowerCase()) : "";
          if (emailMd5)
            avatarUrl = `https://www.gravatar.com/avatar/${emailMd5}?d=mp&s=200`;
        }
        avatarCache[email] = avatarUrl;
        return avatarUrl;
      }
    } catch (e) {}
    const fallbackMd5 = md5 ? md5(email.trim().toLowerCase()) : "";
    return fallbackMd5
      ? `https://www.gravatar.com/avatar/${fallbackMd5}?d=mp&s=200`
      : "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
  };

  // ---------- 获取当前用户信息（缓存） ----------
  let cachedUser = null;
  // 获取当前用户（带头像修复）
  window.getCurrentUser = async function (forceRefresh = false) {
    if (!forceRefresh && cachedUser) return cachedUser;
    try {
      const res = await fetch("/api/user/current", { credentials: "include" });
      if (res.ok) {
        cachedUser = await res.json();
        // 强制使用 Gravatar，忽略服务器返回的任何 avatar 路径
        cachedUser.avatar = getValidAvatarUrl(null, cachedUser.email);
        return cachedUser;
      }
    } catch (e) {}
    return null;
  };

  // 同步左下角头像
  window.syncUserAvatar = async function () {
    const user = await getCurrentUser();
    if (!user) return;
    const avatarUrl = getValidAvatarUrl(user.avatar, user.email);
    const avatarIcon = document.getElementById("avatarIcon");
    if (avatarIcon) {
      avatarIcon.src = avatarUrl;
      avatarIcon.onerror = () => handleAvatarError(avatarIcon, user.email);
    }
    let profile = JSON.parse(localStorage.getItem("user_profile") || "{}");
    if (profile.avatar !== avatarUrl) {
      profile.avatar = avatarUrl;
      localStorage.setItem("user_profile", JSON.stringify(profile));
      window.dispatchEvent(
        new CustomEvent("profileUpdated", { detail: profile }),
      );
    }
  };

  // ---------- 通知条 ----------
  let notifTimeout = null;
  window.showNotificationBar = function (msg) {
    const bar = document.getElementById("notificationBar");
    const span = document.getElementById("notificationMsg");
    if (!bar || !span) return;
    span.innerText = msg;
    bar.style.display = "block";
    if (notifTimeout) clearTimeout(notifTimeout);
    notifTimeout = setTimeout(() => {
      bar.style.display = "none";
    }, 5000);
  };

  // ---------- 加载通知列表（通用） ----------
  window.loadNotificationList = async function () {
    const container = document.getElementById("notificationList");
    if (!container) return;
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) throw new Error();
      const notifs = await res.json();
      if (!notifs.length) {
        container.innerHTML =
          '<div style="color:#aaa; text-align:center; padding:20px;">暂无消息</div>';
        return;
      }
      container.innerHTML = "";
      notifs.forEach((notif) => {
        const div = document.createElement("div");
        div.className = "msg-item";
        div.innerHTML = `<div>${escapeHtml(notif.message)}</div><small style="color:#888;">${new Date(notif.createdAt).toLocaleString()}</small>${!notif.read ? '<span class="red-dot"></span>' : ""}`;
        if (notif.replyText)
          div.setAttribute("data-replytext", notif.replyText);
        div.addEventListener("click", () => {
          if (notif.type === "comment_reply" && notif.animeId) {
            const replyText = div.getAttribute("data-replytext") || "";
            showQuickReplyModal(
              notif.animeId,
              notif.commentId,
              notif.from,
              replyText,
            );
          } else if (notif.type === "friend_request") {
            handleFriendRequest(notif.from);
          } else if (notif.type === "new_message") {
            openChatWithFriend(notif.from);
          }
          markNotificationRead(notif.id);
          div.querySelector(".red-dot")?.remove();
        });
        container.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      container.innerHTML =
        '<div style="color:#aaa; text-align:center; padding:20px;">加载失败</div>';
    }
  };

  window.markNotificationRead = async function (id) {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: [id] }),
      });
    } catch (e) {}
  };

  window.handleFriendRequest = async function (fromEmail) {
    const confirmed = await showCustomModal({
      title: "好友请求",
      message: `确定要添加 ${fromEmail} 为好友吗？`,
      confirmText: "同意",
    });
    if (confirmed) {
      const res = await fetch("/api/friends/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ requestId: fromEmail }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("已添加好友");
        loadNotificationList();
        loadFriendsList();
      } else showToast("操作失败");
    }
  };

  window.showQuickReplyModal = function (
    animeId,
    commentId,
    replierEmail,
    originalReplyText,
  ) {
    const modal = document.createElement("div");
    modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a1a1a;
            border: 1px solid #ffd700;
            border-radius: 20px;
            padding: 20px;
            width: 80%;
            max-width: 400px;
            z-index: 100000;
            box-shadow: 0 0 20px rgba(0,0,0,0.8);
        `;
    modal.innerHTML = `
            <h4 style="color:#ffd700;">回复 ${escapeHtml(replierEmail)}</h4>
            <div style="margin-bottom: 10px; padding: 8px; background: #222; border-radius: 8px; color: #aaa; font-size: 0.85rem;">
                原回复：${escapeHtml(originalReplyText) || "(无内容)"}
            </div>
            <textarea id="quickReplyText" rows="3" placeholder="输入你的回复..." style="width:100%; background:#111; color:#fff; border:1px solid #444; border-radius:8px; padding:8px;"></textarea>
            <div style="display:flex; gap:10px; margin-top:15px;">
                <button id="quickReplySend" style="background:#ffd700; color:#000; border:none; padding:8px 20px; border-radius:30px;">发送</button>
                <button id="quickReplyCancel" style="background:#444; color:#fff; border:none; padding:8px 20px; border-radius:30px;">取消</button>
                <button id="quickReplyJump" style="background:#444; color:#fff; border:none; padding:8px 20px; border-radius:30px;">跳转</button>
            </div>
        `;
    document.body.appendChild(modal);
    document.getElementById("quickReplySend").onclick = async () => {
      const text = document.getElementById("quickReplyText").value.trim();
      if (!text) return showToast("请输入回复内容");
      const res = await authFetch(`/api/anime/${animeId}/comment`, {
        method: "POST",
        body: { parentId: commentId, text },
      });
      if (res.ok) {
        showToast("回复已发送");
        modal.remove();
        loadNotificationList();
      } else showToast("回复失败");
    };
    document.getElementById("quickReplyCancel").onclick = () => modal.remove();
    document.getElementById("quickReplyJump").onclick = () => {
      window.location.href = `/anime/${animeId}`;
    };
  };

  // ---------- 好友列表（带备注） ----------
  window.loadFriendsList = async function () {
    const container = document.getElementById("friendsList");
    if (!container) return;
    const notesRes = await fetch("/api/friends/notes", {
      credentials: "include",
    });
    const notes = await notesRes.json();
    try {
      const res = await fetch("/api/friends/list", { credentials: "include" });
      const data = await res.json();
      if (!data.length) {
        container.innerHTML =
          '<div style="color:#aaa; text-align:center; padding:20px;">暂无好友</div>';
        return;
      }
      container.innerHTML = "";
      data.forEach((friend) => {
        const note = notes[friend.email] || "";
        const displayName =
          note || friend.username || friend.email.split("@")[0];
        const div = document.createElement("div");
        div.className = "msg-item";
        div.innerHTML = `
                    <img src="${friend.avatar || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp"}" class="friend-avatar" onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'">
                    <span class="friend-name">${escapeHtml(displayName)}</span>
                    <button class="edit-note-btn" data-email="${friend.email}" title="设置备注">✏️</button>
                `;
        div.querySelector(".edit-note-btn").onclick = async (e) => {
          e.stopPropagation();
          const currentNote = notes[friend.email] || "";
          const modal = document.createElement("div");
          modal.style.cssText = `
                        position: fixed;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #1a1a1a;
                        border: 2px solid #ffd700;
                        border-radius: 20px;
                        padding: 20px;
                        width: 300px;
                        z-index: 100000;
                        box-shadow: 0 0 30px rgba(255,215,0,0.3);
                    `;
          modal.innerHTML = `
                        <h3 style="color:#ffd700; text-align:center; margin-bottom:15px;">设置备注</h3>
                        <input type="text" id="noteInput" placeholder="输入备注名（留空删除）" value="${escapeHtml(currentNote)}"
                            style="width:100%; padding:10px; margin-bottom:20px; background:#111; border:1px solid #444; color:#fff; border-radius:8px;">
                        <div style="display: flex; justify-content: center; gap: 15px;">
                            <button id="noteConfirm" style="background:#ffd700; color:#000; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">确认</button>
                            <button id="noteCancel" style="background:#444; color:#fff; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">取消</button>
                        </div>
                    `;
          document.body.appendChild(modal);
          const input = modal.querySelector("#noteInput");
          const confirmBtn = modal.querySelector("#noteConfirm");
          const cancelBtn = modal.querySelector("#noteCancel");
          const closeModal = () => modal.remove();
          confirmBtn.onclick = async () => {
            const newNote = input.value.trim();
            const res = await authFetch("/api/friends/note", {
              method: "POST",
              body: { friendEmail: friend.email, note: newNote || "" },
            });
            if (res.ok) {
              showToast("备注已更新");
              loadFriendsList();
            } else showToast("设置失败");
            closeModal();
          };
          cancelBtn.onclick = closeModal;
          modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
          });
        };
        div.addEventListener("click", (e) => {
          if (e.target.classList.contains("edit-note-btn")) return;
          openChatWithFriend(friend.email);
        });
        container.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      container.innerHTML =
        '<div style="color:#aaa; text-align:center; padding:20px;">加载失败</div>';
    }
  };

  // ---------- 聊天系统（统一） ----------
  let currentChatFriend = null;
  let chatPollInterval = null;
  let lastMessageIds = [];

  window.openChatWithFriend = async function (friendEmail) {
    currentChatFriend = friendEmail;
    const chatModal = document.getElementById("chatModal");
    if (!chatModal) return;
    document.getElementById("chatFriendName").innerText =
      friendEmail.split("@")[0];
    chatModal.style.display = "flex";
    await loadChatHistory();
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(loadChatHistory, 3000);
  };

  window.closeChat = function () {
    const chatModal = document.getElementById("chatModal");
    if (chatModal) chatModal.style.display = "none";
    if (chatPollInterval) clearInterval(chatPollInterval);
    currentChatFriend = null;
    lastMessageIds = [];
  };

  window.loadChatHistory = async function () {
    if (!currentChatFriend) return;
    const res = await fetch(
      `/api/messages/history?friend=${encodeURIComponent(currentChatFriend)}`,
      { credentials: "include" },
    );
    if (!res.ok) return;
    let history = await res.json();
    history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const container = document.getElementById("chatMessages");
    if (!container) return;
    const shouldScroll =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 50;

    const displayedIds = new Set(lastMessageIds);
    const newMessages = history.filter((msg) => !displayedIds.has(msg._id));
    if (newMessages.length === 0) return;

    lastMessageIds = history.map((msg) => msg._id);
    const currentUser = await getCurrentUser();
    if (!currentUser) return;

    for (const msg of newMessages) {
      const isMe = msg.from === currentUser.email;
      const avatar = isMe ? currentUser.avatar : await getUserAvatar(msg.from);
      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.alignItems = "flex-start";
      div.style.gap = "8px";
      div.style.marginBottom = "12px";
      div.style.flexDirection = isMe ? "row-reverse" : "row";
      div.innerHTML = `
                <img src="${avatar}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" onerror="this.src='https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp'">
                <div style="max-width:70%;">
                    <div style="background:${isMe ? "#2a2a2a" : "#111"}; padding:8px 12px; border-radius:12px; display:inline-block;">
                        ${escapeHtml(msg.text)}
                    </div>
                    <div style="font-size:0.7rem; color:#888; margin-top:4px;">${new Date(msg.timestamp).toLocaleTimeString()}</div>
                </div>
            `;
      container.appendChild(div);
    }
    if (shouldScroll) container.scrollTop = container.scrollHeight;
  };

  window.sendMessage = async function () {
    const input = document.getElementById("chatInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text || !currentChatFriend) return;
    const res = await authFetch("/api/messages/send", {
      method: "POST",
      body: { to: currentChatFriend, text },
    });
    if (res.ok) {
      input.value = "";
      await loadChatHistory();
    } else showToast("发送失败");
  };

  // ---------- 小红点更新 ----------
  let lastUnreadCount = 0;
  window.updateBadge = function (unreadCount) {
    const badge = document.getElementById("avatarBadge");
    if (badge) badge.style.display = unreadCount > 0 ? "block" : "none";
  };

  // ---------- 轮询新消息（防重复） ----------
  let pollIntervalId = null;
  window.checkNotifications = async function () {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const notifs = await res.json();
      const unread = notifs.filter((n) => !n.read);
      const currentUnread = unread.length;
      if (currentUnread > lastUnreadCount) {
        const newCount = currentUnread - lastUnreadCount;
        showNotificationBar(`您有 ${newCount} 条新消息`);
        if (
          Notification.permission === "granted" &&
          document.getElementById("desktopNotifyCheckbox")?.checked
        ) {
          new Notification("动漫资料库", { body: `您有 ${newCount} 条新消息` });
        }
      }
      lastUnreadCount = currentUnread;
      updateBadge(currentUnread);
      const sideMenu = document.getElementById("sideMenu");
      if (sideMenu && sideMenu.style.left === "0px") {
        const activeTab = document
          .querySelector(".msg-tab.active")
          ?.getAttribute("data-tab");
        if (activeTab === "messages") loadNotificationList();
        else if (activeTab === "friends") loadFriendsList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.startPolling = function () {
    if (pollIntervalId) return;
    setTimeout(() => {
      checkNotifications();
      if (typeof loadFriendsList === "function") loadFriendsList();
      pollIntervalId = setInterval(checkNotifications, 5000);
      if (Notification.permission !== "denied")
        Notification.requestPermission();
    }, 2000);
  };

  // ---------- 侧边栏事件绑定 ----------
  window.initSidebarEvents = function () {
    document
      .getElementById("closeSideMenuBtn")
      ?.addEventListener("click", () => {
        document.getElementById("sideMenu").style.left = "-280px";
      });
    document.querySelectorAll(".msg-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        document
          .querySelectorAll(".msg-tab")
          .forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document
          .querySelectorAll(".msg-panel")
          .forEach((p) => p.classList.remove("active"));
        if (target === "messages") {
          document.getElementById("messagesPanel").classList.add("active");
          loadNotificationList();
        } else if (target === "friends") {
          document.getElementById("friendsPanel").classList.add("active");
          loadFriendsList();
        } else if (target === "settings") {
          document.getElementById("settingsPanel").classList.add("active");
        }
      });
    });
    // 绑定聊天相关按钮（如果存在）
    const sendBtn = document.getElementById("sendChatBtn");
    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    const closeChatBtn = document.getElementById("closeChatBtn");
    if (closeChatBtn) closeChatBtn.addEventListener("click", closeChat);
    const chatInput = document.getElementById("chatInput");
    if (chatInput)
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
      });
  };

  console.log("common.js 已加载完成");
}
