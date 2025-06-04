import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Chat from "../components/Chat";
import PeerComponent from "../components/Peer";
import ScreenShare from "../components/ScreenShare";
import Video from "../components/Video";
import VideoSidebar from "../components/VideoSidebar";
import { answerHandler } from "../messages/handlers/answer";
import { clientJoinedHandler } from "../messages/handlers/client_joined";
import { clientLeftHandler } from "../messages/handlers/client_left";
import { iceCandidateHandler } from "../messages/handlers/iceCandidate";
import { initHandler } from "../messages/handlers/init";
import { offerHandler } from "../messages/handlers/offer";
import { screenShareStartedHandler } from "../messages/handlers/screenShareStarted";
import { screenShareStoppedHandler } from "../messages/handlers/screenShareStopped";
import { streamMetadataHandler } from "../messages/handlers/streamMetadata";
import { trackMutedHandler } from "../messages/handlers/trackMuted";
import { InboundMessage } from "../messages/inbound";
import {
  OutboundScreenShareStartedMessage,
  OutboundScreenShareStoppedMessage,
  OutboundTrackMutedMessage,
} from "../messages/outbound";
import { RoomModel } from "../models/RoomModel";
import { ChatMessage, Peer } from "../peer";
import { authService, User } from "../services/authService";
import { RoomService } from "../services/RoomService";
import { sendStreamMetadata } from "../utils/streamMetadata";

function RoomPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const peersRef = useRef(peers);
  const [isVideoEnabled, setVideoEnabled] = useState(true);
  const [isAudioEnabled, setAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const isScreenSharingRef = useRef(isScreenSharing);
  const [screenStreamVersion, setScreenStreamVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [roomExists, setRoomExists] = useState<boolean | null>(null);
  const [roomData, setRoomData] = useState<RoomModel | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const isChatOpenRef = useRef(isChatOpen);
  // Keep the ref in sync with the state.
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  const localStreamRef = useRef(new MediaStream());
  const screenStreamRef = useRef(new MediaStream());
  const wsRef = useRef<WebSocket | null>(null);
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
    };
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    const checkRoomExists = async () => {
      if (!roomId) {
        navigate("/rooms");
        return;
      }

      try {
        console.log("Checking if room exists:", roomId);
        const room = await RoomService.getRoomById(roomId);
        console.log("Room check result:", room);

        if (room) {
          console.log("Room exists, setting roomExists to true");
          setRoomExists(true);
          setRoomData(room);
        } else {
          console.log("Room not found (404), setting roomExists to false");
          setRoomExists(false);
          setRoomData(null);
          setTimeout(() => navigate("/rooms"), 2000);
        }
      } catch (error) {
        console.error("Error checking room (non-404):", error);
        setRoomExists(true);
        setRoomData(null);
      }
    };

    checkRoomExists();
  }, [roomId, navigate]);

  useEffect(() => {
    isScreenSharingRef.current = isScreenSharing;
  }, [isScreenSharing]);

  const handlePeersChange = (func: (prev: Peer[]) => Peer[]): void => {
    setPeers((prevPeers) => {
      const newPeers = func(prevPeers);
      peersRef.current = newPeers;
      return newPeers;
    });
  };

  // Chat message handler
  const handleChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
    if (!isChatOpenRef.current) {
      setUnreadMessageCount((prev) => prev + 1);
    }
  }, []);

  // Send chat message to all peers
  const sendChatMessage = (text: string) => {
    if (!currentUser) return;

    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      username: currentUser.username,
      timestamp: Date.now(),
      isOwn: true,
    };

    console.log("Sending chat message:", message);
    console.log("Current peers:", peersRef.current.length);

    setChatMessages((prev) => [...prev, message]);

    peersRef.current.forEach((peer) => {
      if (peer.dataChannel) {
        const send = () => {
          try {
            peer.dataChannel!.send(JSON.stringify(message));
          } catch (error) {
            console.error(
              "Error sending chat message to peer:",
              peer.id,
              error
            );
          }
        };

        if (peer.dataChannel.readyState === "open") {
          send();
        } else {
          console.warn(
            `Data channel to peer ${peer.id} not open (state: ${peer.dataChannel.readyState}). Will send once open.`
          );
          const handleOpen = () => {
            send();
            peer.dataChannel!.removeEventListener("open", handleOpen);
          };
          peer.dataChannel.addEventListener("open", handleOpen);
        }
      }
    });
  };

  const toggleChat = () => {
    setIsChatOpen((prev) => {
      const newIsOpen = !prev;
      if (newIsOpen) {
        setUnreadMessageCount(0);
      }
      return newIsOpen;
    });
  };

  const handleScreenShare = async () => {
    const otherScreenSharing = peers.find((peer) => peer.isScreenSharing);
    if (!isScreenSharing && otherScreenSharing) {
      alert(
        `${
          otherScreenSharing.username || "Інший користувач"
        } вже ділиться екраном. Зачекайте, поки вони завершать.`
      );
      return;
    }

    if (isScreenSharing) {
      try {
        screenStream?.getTracks().forEach((track) => {
          track.stop();
        });

        peersRef.current.forEach((peer) => {
          const sendersToRemove: RTCRtpSender[] = [];
          peer.pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === "video") {
              sendersToRemove.push(sender);
            }
          });

          sendersToRemove.forEach((sender) => {
            console.log(
              "Removing video track (stopping screen share):",
              sender.track?.label
            );
            peer.pc.removeTrack(sender);
          });
        });

        if (isVideoEnabled) {
          const cameraVideoTracks = localStreamRef.current.getVideoTracks();
          if (cameraVideoTracks.length > 0) {
            console.log(
              "Re-adding camera video tracks after stopping screen share"
            );
            peersRef.current.forEach((peer) => {
              cameraVideoTracks.forEach((track) => {
                peer.pc.addTrack(track, localStreamRef.current);
              });
            });
          }
        }

        setScreenStream(null);
        screenStreamRef.current = new MediaStream();
        setIsScreenSharing(false);
        setScreenStreamVersion(0);

        const stopMessage: OutboundScreenShareStoppedMessage = {
          type: "screenShareStopped",
          payload: {},
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(stopMessage));
        }
      } catch (error) {
        console.error("Error stopping screen share:", error);
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            frameRate: 30,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: true,
        });

        console.log(
          "Original display stream tracks:",
          displayStream.getTracks().map((t) => ({
            kind: t.kind,
            label: t.label,
            id: t.id,
            enabled: t.enabled,
            readyState: t.readyState,
          }))
        );

        displayStream.getVideoTracks()[0].addEventListener("ended", () => {
          console.log("Screen share ended by user");
          handleScreenShare();
        });

        console.log("Setting screen stream directly from display media");
        setScreenStream(displayStream);
        screenStreamRef.current = displayStream;

        console.log("Screen stream setup complete:", {
          streamId: displayStream.id,
          tracks: displayStream.getTracks().map((t) => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
            id: t.id,
          })),
        });

        const videoTrack = displayStream.getVideoTracks()[0];
        const audioTrack = displayStream.getAudioTracks()[0];
        peersRef.current.forEach((peer) => {
          if (videoTrack) {
            videoTrack.contentHint = "screen";
            peer.pc.addTrack(videoTrack, displayStream);
          }
          if (audioTrack) {
            peer.pc.addTrack(audioTrack, displayStream);
          }
        });

        if (wsRef.current) {
          sendStreamMetadata(wsRef.current, displayStream.id, "screen");
        }

        setIsScreenSharing(true);
        setScreenStreamVersion((prev) => prev + 1);

        const startMessage: OutboundScreenShareStartedMessage = {
          type: "screenShareStarted",
          payload: {},
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(startMessage));
        }

        console.log("Screen sharing started successfully");
      } catch (error) {
        console.error("Error starting screen share:", error);
      }
    }
  };

  const handleToogleVideo = () => {
    setVideoEnabled((prevIsEnabled) => {
      const isEnabled = !prevIsEnabled;
      if (!isEnabled) {
        const [videoTrack] = localStreamRef.current.getVideoTracks();
        if (!videoTrack) return isEnabled;

        console.log("Stopping video track:", videoTrack);
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);

        if (!isScreenSharing) {
          peersRef.current.forEach((peer) => {
            peer.pc.getSenders().forEach((sender) => {
              if (!sender.track || sender.track!.kind !== "video") return;
              peer.remoteStream.removeTrack(sender.track!);
              sender.track!.stop();
              peer.pc.removeTrack(sender);
            });
          });
        }

        const mutedMessage: OutboundTrackMutedMessage = {
          type: "trackMuted",
          payload: { trackKind: "video" },
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(mutedMessage));
        }
      } else {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              frameRate: 30,
              facingMode: { ideal: "user" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          })
          .then((stream) => {
            const videoTracks = stream.getVideoTracks();
            console.log("Got new video tracks:", videoTracks);

            if (videoTracks.length > 0) {
              videoTracks.forEach((track) => {
                console.log("Adding video track to local stream:", track.id);
                localStreamRef.current.addTrack(track);
              });

              console.log(
                "Updated local stream tracks:",
                localStreamRef.current.getTracks()
              );

              if (!isScreenSharing) {
                peersRef.current.forEach((peer) => {
                  videoTracks.forEach((track) => {
                    console.log("Adding video track to peer:", peer.id);
                    peer.pc.addTrack(track, localStreamRef.current);
                  });
                });
              }

              setVideoEnabled(true);
            }
          })
          .catch((err) => {
            console.error("Error getting video stream:", err);
            return prevIsEnabled;
          });
      }

      return isEnabled;
    });
  };

  const handleToggleAudio = () => {
    setAudioEnabled((prevIsEnabled) => {
      const isEnabled = !prevIsEnabled;
      if (!isEnabled) {
        const [audioTrack] = localStreamRef.current.getAudioTracks();
        if (!audioTrack) return isEnabled;
        audioTrack.stop();
        localStreamRef.current.removeTrack(audioTrack);

        peersRef.current.forEach((peer) => {
          peer.pc.getSenders().forEach((sender) => {
            if (!sender.track || sender.track!.kind !== "audio") return;
            peer.remoteStream.removeTrack(sender.track!);
            sender.track!.stop();
            peer.pc.removeTrack(sender);
          });
        });

        const mutedMessage: OutboundTrackMutedMessage = {
          type: "trackMuted",
          payload: { trackKind: "audio" },
        };

        if (wsRef.current) {
          wsRef.current.send(JSON.stringify(mutedMessage));
        }
      } else {
        navigator.mediaDevices
          .getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          .then((stream) => {
            const audioTracks = stream.getAudioTracks();
            console.log("Got new audio tracks:", audioTracks);

            audioTracks.forEach((track) => {
              localStreamRef.current.addTrack(track);
            });

            peersRef.current.forEach((peer) => {
              audioTracks.forEach((track) => {
                console.log("Adding audio track to peer:", peer.id);
                peer.pc.addTrack(track, localStreamRef.current);
              });
            });

            // Send metadata for the local stream
            if (wsRef.current && audioTracks.length > 0) {
              sendStreamMetadata(
                wsRef.current,
                localStreamRef.current.id,
                "media"
              );
            }
          })
          .catch((err) => {
            console.error("Error getting audio stream:", err);
            return prevIsEnabled; // Keep previous state on error
          });
      }

      return isEnabled;
    });
  };

  const handleEndCall = () => {
    console.log("Ending call and cleaning up resources");

    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Stop all local media streams
    const localStream = localStreamRef.current;
    localStream.getTracks().forEach((track) => {
      track.stop();
      localStream.removeTrack(track);
    });

    // Stop screen sharing stream
    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        track.stop();
      });
      setScreenStream(null);
    }
    screenStreamRef.current.getTracks().forEach((track) => {
      track.stop();
      screenStreamRef.current.removeTrack(track);
    });

    // Close all peer connections
    peersRef.current.forEach((peer) => {
      if (peer.pc) {
        peer.pc.close();
      }
    });

    // Clear peers state
    setPeers([]);
    peersRef.current = [];

    // Navigate back to rooms page
    navigate("/rooms");
  };

  useEffect(() => {
    // Only set up WebSocket if room exists
    if (roomExists !== true) return;

    let ws: WebSocket;
    let isMounted = true;

    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          frameRate: 30,
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (!isMounted) return;
      stream.getTracks().forEach((track) => {
        localStreamRef.current.addTrack(track);
      });

      console.log("Local stream tracks:", localStreamRef.current.getTracks());

      // Use the same hostname that the user used to access the site
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const token = authService.getToken();
      const wsUrl = `${wsProtocol}//localhost:8000/ws?token=${encodeURIComponent(
        token || ""
      )}&roomId=${encodeURIComponent(roomId || "")}`;
      console.log("Connecting to WebSocket at:", wsUrl);

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log("WebSocket connection was opened");

      ws.onmessage = async (event) => {
        const message: InboundMessage = JSON.parse(event.data);

        if (message.type === "init") {
          initHandler({
            message,
            ws,
            rtcConfig,
            handlePeersChange,
            localStream: localStreamRef.current,
            onChatMessage: handleChatMessage,
          });
        } else if (message.type === "client_joined") {
          await clientJoinedHandler({
            message,
            rtcConfig,
            ws,
            handlePeersChange,
            localStream: localStreamRef.current,
            screenStream: screenStreamRef.current,
            isScreenSharing: isScreenSharingRef.current,
            onChatMessage: handleChatMessage,
          });

          // If we (the local user) are currently sharing the screen, inform the newly joined peer.
          if (isScreenSharingRef.current) {
            const startMessage: OutboundScreenShareStartedMessage = {
              type: "screenShareStarted",
              payload: {},
            };
            ws.send(JSON.stringify(startMessage));
          }
        } else if (message.type === "client_left") {
          clientLeftHandler({ message, handlePeersChange });
        } else if (message.type === "offer") {
          await offerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "answer") {
          await answerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "iceCandidate") {
          iceCandidateHandler({ message, peers: peersRef.current });
        } else if (message.type === "trackMuted") {
          trackMutedHandler({
            peers: peersRef.current,
            message,
            handlePeersChange,
          });
        } else if (message.type === "streamMetadata") {
          streamMetadataHandler({ message });
        } else if (message.type === "screenShareStarted") {
          screenShareStartedHandler({ message, handlePeersChange });
        } else if (message.type === "screenShareStopped") {
          screenShareStoppedHandler({ message, handlePeersChange });
        }
      };
    })();

    return () => {
      isMounted = false;
      if (ws) ws.close();
      peers.forEach((client) => client.pc?.close());

      const localStream = localStreamRef.current;
      localStream.getAudioTracks().forEach((track) => {
        track.stop();
        localStream.removeTrack(track);
      });
      setPeers([]);
    };
  }, [roomExists, roomId]);

  // Show loading while checking room existence
  if (roomExists === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          backgroundColor: "#1a1a1a",
          color: "white",
        }}
      >
        Завантаження кімнати...
      </div>
    );
  }

  // Show error message if room doesn't exist
  if (roomExists === false) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
          backgroundColor: "#1a1a1a",
          color: "white",
          textAlign: "center",
        }}
      >
        <h2>Кімнату не знайдено</h2>
        <p>Кімната, до якої ви намагаєтеся приєднатися, не існує.</p>
        <p>Перенаправлення на сторінку кімнат...</p>
      </div>
    );
  }

  // Check if anyone is screen sharing
  const screenSharingPeer = peers.find((peer) => peer.isScreenSharing);
  const isAnyoneScreenSharing = isScreenSharing || !!screenSharingPeer;

  // Debug screen sharing state
  console.log("Screen sharing debug:", {
    isScreenSharing,
    screenSharingPeer: screenSharingPeer
      ? {
          id: screenSharingPeer.id,
          username: screenSharingPeer.username,
          isScreenSharing: screenSharingPeer.isScreenSharing,
          remoteStreamTracks: screenSharingPeer.remoteStream
            .getTracks()
            .map((t) => ({
              kind: t.kind,
              label: t.label,
              id: t.id,
              enabled: t.enabled,
              readyState: t.readyState,
            })),
          remoteScreenStreamTracks: screenSharingPeer.remoteScreenStream
            .getTracks()
            .map((t) => ({
              kind: t.kind,
              label: t.label,
              id: t.id,
              enabled: t.enabled,
              readyState: t.readyState,
            })),
        }
      : null,
    isAnyoneScreenSharing,
    screenStream: screenStream
      ? {
          id: screenStream.id,
          tracks: screenStream.getTracks().map((t) => ({
            kind: t.kind,
            label: t.label,
            enabled: t.enabled,
            readyState: t.readyState,
          })),
        }
      : null,
  });

  // Calculate grid layout classes based on number of participants
  const totalParticipants = peers.length + 1; // Including local user
  let gridClass = "grid-1";

  if (totalParticipants <= 1) {
    gridClass = "grid-1";
  } else if (totalParticipants <= 2) {
    gridClass = "grid-2";
  } else if (totalParticipants <= 4) {
    gridClass = "grid-4";
  } else if (totalParticipants <= 9) {
    gridClass = "grid-9";
  } else {
    gridClass = "grid-16";
  }

  // Screen sharing button properties
  const otherUserScreenSharing = !isScreenSharing && screenSharingPeer;
  const screenShareButtonDisabled = !!otherUserScreenSharing;
  const screenShareButtonClass = otherUserScreenSharing
    ? "btn btn-secondary"
    : isScreenSharing
    ? "btn btn-warning"
    : "btn btn-outline-light";
  const screenShareButtonTitle = otherUserScreenSharing
    ? `${screenSharingPeer?.username || "Інший користувач"} ділиться екраном`
    : isScreenSharing
    ? "Припинити демонстрацію екрану"
    : "Демонструвати екран";

  return (
    <div className="room-container d-flex flex-column vh-100 bg-dark">
      <div className="room-header d-flex justify-content-between align-items-center p-3">
        <h4 className="text-white m-0">
          {roomData?.name || roomId || "Кімната зустрічі"}
        </h4>
      </div>

      <div
        className={`video-content flex-grow-1 overflow-auto p-3 ${
          isChatOpen ? "chat-open" : ""
        }`}
      >
        {isAnyoneScreenSharing ? (
          // Screen sharing layout
          <div className="screen-share-layout">
            <div className="screen-share-main">
              {isScreenSharing && screenStream ? (
                <ScreenShare
                  key={`local-screen-${screenStream.id}-${screenStreamVersion}`}
                  stream={screenStream}
                  username={currentUser?.username}
                  isLocal={true}
                />
              ) : screenSharingPeer ? (
                <ScreenShare
                  key={`peer-screen-${screenSharingPeer.id}-${screenSharingPeer.remoteScreenStream.id}`}
                  stream={screenSharingPeer.remoteScreenStream}
                  username={screenSharingPeer.username}
                  isLocal={false}
                />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 w-100 bg-dark text-white">
                  <div className="text-center">
                    <i className="bi bi-display display-1 mb-3 opacity-50"></i>
                    <p className="h5">Ініціалізація демонстрації екрану...</p>
                  </div>
                </div>
              )}
            </div>
            <div className="screen-share-sidebar">
              <VideoSidebar
                peers={peers}
                localStream={localStreamRef.current}
                currentUser={currentUser}
                isVideoEnabled={isVideoEnabled}
                isAudioEnabled={isAudioEnabled}
                maxVisibleParticipants={4}
              />
            </div>
          </div>
        ) : (
          // Normal grid layout
          <div className={`video-grid ${gridClass}`}>
            <div className="video-container position-relative">
              <div className="position-absolute z-1 bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom-3 ps-3 pe-3">
                {currentUser?.username || "Ви"}
                <i
                  className={`ms-2 bi ${
                    isAudioEnabled ? "" : "bi-mic-mute-fill text-danger"
                  }`}
                ></i>
              </div>
              <Video
                stream={localStreamRef.current}
                mirrored={true}
                muted={true}
                username={currentUser?.username || "Ви"}
                showPlaceholder={!isVideoEnabled}
              />
            </div>

            {peers.map((peer) => (
              <PeerComponent
                key={peer.id}
                peer={peer}
                isVideoEnabled={isVideoEnabled}
              />
            ))}
          </div>
        )}
      </div>

      <div className="room-footer bg-dark border-top border-secondary p-3">
        <div className="d-flex justify-content-center gap-4">
          <button
            onClick={handleToogleVideo}
            className={`btn ${
              isVideoEnabled ? "btn-outline-light" : "btn-danger"
            } rounded-circle`}
          >
            <i
              className={`bi ${
                isVideoEnabled ? "bi-camera-video" : "bi-camera-video-off"
              }`}
            ></i>
          </button>

          <button
            onClick={handleToggleAudio}
            className={`btn ${
              isAudioEnabled ? "btn-outline-light" : "btn-danger"
            } rounded-circle`}
          >
            <i
              className={`bi ${isAudioEnabled ? "bi-mic" : "bi-mic-mute"}`}
            ></i>
          </button>

          <button
            onClick={handleScreenShare}
            disabled={screenShareButtonDisabled}
            className={`${screenShareButtonClass} rounded-circle`}
            title={screenShareButtonTitle}
          >
            <i
              className={`bi ${
                isScreenSharing ? "bi-stop-circle" : "bi-display"
              }`}
            ></i>
          </button>

          <button
            onClick={toggleChat}
            className="btn btn-outline-light rounded-circle position-relative"
            title="Чат"
          >
            <i className="bi bi-chat-dots"></i>
            {unreadMessageCount > 0 && (
              <span className="chat-notification">
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            )}
          </button>

          <button
            onClick={handleEndCall}
            className="btn btn-outline-danger rounded-circle"
          >
            <i className="bi bi-telephone-x"></i>
          </button>
        </div>
      </div>

      <Chat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={sendChatMessage}
      />
    </div>
  );
}

export default RoomPage;
