// ==================== 公共函数（完整版，含反馈功能） ====================
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

  // 辅助：头像加载失败时的回退
  window.handleAvatarError = function (imgElement) {
    if (imgElement.src.includes("gravatar.com")) return;
    imgElement.src =
      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
    imgElement.onerror = null;
  };

  // 带 session 的 fetch
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

  // HTML 转义
  window.escapeHtml = function (str) {
    if (!str) return "";
    return String(str).replace(/[&<>]/g, function (m) {
      if (m === "&") return "&amp;";
      if (m === "<") return "&lt;";
      if (m === ">") return "&gt;";
      return m;
    });
  };

  // 自定义模态框
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
          ${options.showCancel !== false ? '<button id="modalCancel" style="background:#444; color:#fff; border:none; padding:8px 20px; border-radius:30px; cursor:pointer;">取消</button>' : ""}
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
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.remove();
          resolve(false);
        };
      }
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
        if (!avatarUrl) {
          avatarUrl =
            "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
        }
        avatarCache[email] = avatarUrl;
        return avatarUrl;
      }
    } catch (e) {}
    return "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
  };

  // ---------- 获取当前用户信息 ----------
  let cachedUser = null;
  window.getCurrentUser = async function (forceRefresh = false) {
    if (!forceRefresh && cachedUser) return cachedUser;
    try {
      const res = await fetch("/api/user/current", { credentials: "include" });
      if (res.ok) {
        cachedUser = await res.json();
        return cachedUser;
      }
    } catch (e) {}
    return null;
  };

  // 同步左下角头像
  window.syncUserAvatar = async function () {
    const user = await window.getCurrentUser(true);
    if (!user) return;
    let avatarUrl = user.avatar;
    if (!avatarUrl) {
      avatarUrl =
        "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp";
    }
    const avatarIcon = document.getElementById("avatarIcon");
    if (avatarIcon) {
      avatarIcon.src = avatarUrl;
      avatarIcon.onerror = () => window.handleAvatarError(avatarIcon);
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

  // 加载通知列表
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
        div.innerHTML = `<div>${window.escapeHtml(notif.message)}</div><small style="color:#888;">${new Date(notif.createdAt).toLocaleString()}</small>${!notif.read ? '<span class="red-dot"></span>' : ""}`;
        if (notif.replyText)
          div.setAttribute("data-replytext", notif.replyText);
        div.addEventListener("click", () => {
          if (notif.type === "comment_reply" && notif.animeId) {
            const replyText = div.getAttribute("data-replytext") || "";
            window.showQuickReplyModal(
              notif.animeId,
              notif.commentId,
              notif.from,
              replyText,
            );
          } else if (notif.type === "friend_request") {
            window.handleFriendRequest(notif.from);
          } else if (notif.type === "new_message") {
            window.openChatWithFriend(notif.from);
          }
          window.markNotificationRead(notif.id);
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
    const confirmed = await window.showCustomModal({
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
        window.showToast("已添加好友");
        window.loadNotificationList();
        window.loadFriendsList();
      } else {
        window.showToast("操作失败");
      }
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
      <h4 style="color:#ffd700;">回复 ${window.escapeHtml(replierEmail)}</h4>
      <div style="margin-bottom:10px; padding:8px; background:#222; border-radius:8px; color:#aaa; font-size:0.85rem;">
        原回复：${window.escapeHtml(originalReplyText) || "(无内容)"}
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
      if (!text) return window.showToast("请输入回复内容");
      const res = await window.authFetch(`/api/anime/${animeId}/comment`, {
        method: "POST",
        body: { parentId: commentId, text },
      });
      if (res.ok) {
        window.showToast("回复已发送");
        modal.remove();
        window.loadNotificationList();
      } else {
        window.showToast("回复失败");
      }
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
          <span class="friend-name">${window.escapeHtml(displayName)}</span>
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
            <input type="text" id="noteInput" placeholder="输入备注名（留空删除）" value="${window.escapeHtml(currentNote)}"
              style="width:100%; padding:10px; margin-bottom:20px; background:#111; border:1px solid #444; color:#fff; border-radius:8px;">
            <div style="display:flex; justify-content:center; gap:15px;">
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
            const res = await window.authFetch("/api/friends/note", {
              method: "POST",
              body: { friendEmail: friend.email, note: newNote || "" },
            });
            if (res.ok) {
              window.showToast("备注已更新");
              window.loadFriendsList();
            } else {
              window.showToast("设置失败");
            }
            closeModal();
          };
          cancelBtn.onclick = closeModal;
          modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
          });
        };
        div.addEventListener("click", (e) => {
          if (e.target.classList.contains("edit-note-btn")) return;
          window.openChatWithFriend(friend.email);
        });
        container.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      container.innerHTML =
        '<div style="color:#aaa; text-align:center; padding:20px;">加载失败</div>';
    }
  };

  // ---------- 聊天系统 ----------
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
    await window.loadChatHistory();
    if (chatPollInterval) clearInterval(chatPollInterval);
    chatPollInterval = setInterval(window.loadChatHistory, 3000);
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
    const currentUser = await window.getCurrentUser();
    if (!currentUser) return;
    for (const msg of newMessages) {
      const isMe = msg.from === currentUser.email;
      const avatar = isMe
        ? currentUser.avatar
        : await window.getUserAvatar(msg.from);
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
            ${window.escapeHtml(msg.text)}
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
    const res = await window.authFetch("/api/messages/send", {
      method: "POST",
      body: { to: currentChatFriend, text },
    });
    if (res.ok) {
      input.value = "";
      await window.loadChatHistory();
    } else {
      window.showToast("发送失败");
    }
  };

  // 小红点更新
  let lastUnreadCount = 0;
  window.updateBadge = function (unreadCount) {
    const badge = document.getElementById("avatarBadge");
    if (badge) badge.style.display = unreadCount > 0 ? "block" : "none";
  };

  // 轮询新消息
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
        window.showNotificationBar(`您有 ${newCount} 条新消息`);
        if (
          Notification.permission === "granted" &&
          document.getElementById("desktopNotifyCheckbox")?.checked
        ) {
          new Notification("动漫资料库", { body: `您有 ${newCount} 条新消息` });
        }
      }
      lastUnreadCount = currentUnread;
      window.updateBadge(currentUnread);
      const sideMenu = document.getElementById("sideMenu");
      if (sideMenu && sideMenu.style.left === "0px") {
        const activeTab = document
          .querySelector(".msg-tab.active")
          ?.getAttribute("data-tab");
        if (activeTab === "messages") window.loadNotificationList();
        else if (activeTab === "friends") window.loadFriendsList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  window.startPolling = function () {
    if (pollIntervalId) return;
    setTimeout(() => {
      window.checkNotifications();
      if (typeof window.loadFriendsList === "function")
        window.loadFriendsList();
      pollIntervalId = setInterval(window.checkNotifications, 5000);
      if (Notification.permission !== "denied")
        Notification.requestPermission();
    }, 2000);
  };

  // 侧边栏事件绑定
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
          window.loadNotificationList();
        } else if (target === "friends") {
          document.getElementById("friendsPanel").classList.add("active");
          window.loadFriendsList();
        } else if (target === "settings") {
          document.getElementById("settingsPanel").classList.add("active");
        }
      });
    });
    const sendBtn = document.getElementById("sendChatBtn");
    if (sendBtn) sendBtn.addEventListener("click", window.sendMessage);
    const closeChatBtn = document.getElementById("closeChatBtn");
    if (closeChatBtn) closeChatBtn.addEventListener("click", window.closeChat);
    const chatInput = document.getElementById("chatInput");
    if (chatInput)
      chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") window.sendMessage();
      });
  };

  // 初始化左下角头像
  (function initAvatarIfNeeded() {
    const avatarIcon = document.getElementById("avatarIcon");
    if (!avatarIcon) return;
    syncUserAvatar();
  })();

  // ========== 新增：全局意见反馈功能 ==========
  window.compressImage = function (file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              const reader2 = new FileReader();
              reader2.onload = () => resolve(reader2.result);
              reader2.readAsDataURL(blob);
            },
            "image/jpeg",
            quality,
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  window.initReportModal = function () {
    const reportModal = document.getElementById("reportModal");
    const submitReportBtn = document.getElementById("submitReportBtn");
    if (!reportModal || !submitReportBtn) {
      console.warn("反馈模态框或按钮不存在，2秒后重试");
      setTimeout(window.initReportModal, 2000);
      return;
    }
    console.log("反馈模态框初始化成功，绑定事件");
    const reportType = document.getElementById("reportType");
    const reportDesc = document.getElementById("reportDesc");
    const reportImage = document.getElementById("reportImage");
    const imagePreview = document.getElementById("imagePreview");
    const closeReportBtn = document.getElementById("closeReportBtn");
    const feedbackBtn = document.getElementById("feedbackBtn");

    // 打开模态框
    if (feedbackBtn) {
      feedbackBtn.onclick = () => {
        reportModal.style.display = "flex";
      };
    }

    // 关闭模态框
    const closeModal = () => {
      reportModal.style.display = "none";
      if (reportType) reportType.value = "bug";
      if (reportDesc) reportDesc.value = "";
      if (reportImage) reportImage.value = "";
      if (imagePreview) imagePreview.innerHTML = "";
    };
    if (closeReportBtn) closeReportBtn.onclick = closeModal;
    reportModal.onclick = (e) => {
      if (e.target === reportModal) closeModal();
    };

    // 图片预览
    if (reportImage) {
      reportImage.onchange = function (e) {
        const file = e.target.files[0];
        if (file && imagePreview) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            imagePreview.innerHTML = `<img src="${ev.target.result}" style="max-width:100%;max-height:150px;border-radius:8px;border:1px solid #ffd700">`;
          };
          reader.readAsDataURL(file);
        } else if (imagePreview) {
          imagePreview.innerHTML = "";
        }
      };
    }

    // 提交处理函数
    const handleSubmit = async () => {
      console.log("提交反馈被点击");
      try {
        const type = reportType ? reportType.value : "bug";
        const description = reportDesc ? reportDesc.value.trim() : "";
        if (!description) {
          window.showToast("请填写问题描述");
          return;
        }
        const file = reportImage && reportImage.files[0];
        let imageBase64 = null;
        if (file) {
          if (file.size > 10 * 1024 * 1024) {
            window.showToast("图片不能超过 10MB");
            return;
          }
          if (typeof window.compressImage === "function") {
            imageBase64 = await window.compressImage(file);
          } else {
            window.showToast("图片处理失败，请刷新页面重试");
            return;
          }
        }
        const res = await fetch("/api/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            type,
            description,
            imageBase64: imageBase64 || null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          window.showToast("反馈已提交，感谢您的支持！");
          closeModal();
        } else {
          window.showToast("提交失败：" + (data.error || "请稍后重试"));
        }
      } catch (err) {
        console.error("反馈提交错误:", err);
        window.showToast("网络错误，请重试");
      }
    };
    // 移除旧监听并添加新监听
    submitReportBtn.removeEventListener("click", handleSubmit);
    submitReportBtn.addEventListener("click", handleSubmit);
  };
  console.log("common.js 已加载完成（含反馈功能）");
}
