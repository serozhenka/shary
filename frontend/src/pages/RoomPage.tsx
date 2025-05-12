import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import PeerComponent from "../components/Peer";
import Video from "../components/Video";
import { answerHandler } from "../messages/handlers/answer";
import { clientJoinedHandler } from "../messages/handlers/client_joined";
import { clientLeftHandler } from "../messages/handlers/client_left";
import { iceCandidateHandler } from "../messages/handlers/iceCandidate";
import { initHandler } from "../messages/handlers/init";
import { offerHandler } from "../messages/handlers/offer";
import { trackMutedHandler } from "../messages/handlers/trackMuted";
import { InboundMessage } from "../messages/inbound";
import { OutboundTrackMutedMessage } from "../messages/outbound";
import { Peer } from "../peer";

function RoomPage() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const peersRef = useRef(peers);
  const [isVideoEnabled, setVideoEnabled] = useState(true);
  const localStreamRef = useRef(new MediaStream());
  const wsRef = useRef<WebSocket | null>(null);
  const { roomId } = useParams<{ roomId: string }>();

  const rtcConfig: RTCConfiguration = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };

  const handlePeersChange = (func: (prev: Peer[]) => Peer[]): void => {
    setPeers((prevPeers) => {
      const newPeers = func(prevPeers);
      peersRef.current = newPeers;
      return newPeers;
    });
  };

  const handleToogleVideo = () => {
    setVideoEnabled((prevIsEnabled) => {
      const isEnabled = !prevIsEnabled;
      if (!isEnabled) {
        const [videoTrack] = localStreamRef.current.getVideoTracks();
        if (!videoTrack) return isEnabled;

        console.log(videoTrack);
        videoTrack.stop();
        localStreamRef.current.removeTrack(videoTrack);

        peersRef.current.forEach((peer) => {
          peer.pc.getSenders().forEach((sender) => {
            if (!sender.track || sender.track!.kind !== "video") return;
            peer.remoteStream.removeTrack(sender.track!);
            sender.track!.stop();
            peer.pc.removeTrack(sender);
          });
        });

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
              // Add all video tracks to local stream
              videoTracks.forEach((track) => {
                localStreamRef.current.addTrack(track);
              });

              // Add tracks to all peers
              peersRef.current.forEach((peer) => {
                videoTracks.forEach((track) => {
                  console.log("Adding video track to peer:", peer.id);
                  peer.pc.addTrack(track, localStreamRef.current);
                });
              });
            }
          })
          .catch((err) => {
            console.error("Error getting video stream:", err);
            return prevIsEnabled; // Keep previous state on error
          });
      }

      return isEnabled;
    });
  };

  useEffect(() => {
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
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws`;
      console.log("Connecting to WebSocket at:", wsUrl);

      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => console.log("WebSocket connection was opened");

      ws.onmessage = async (event) => {
        let message: InboundMessage = JSON.parse(event.data);

        if (message.type === "init") {
          initHandler({
            message,
            ws,
            rtcConfig,
            handlePeersChange,
            localStream: localStreamRef.current,
          });
        } else if (message.type === "client_joined") {
          await clientJoinedHandler({
            message,
            rtcConfig,
            ws,
            handlePeersChange,
            localStream: localStreamRef.current,
          });
        } else if (message.type === "client_left") {
          clientLeftHandler({ message, handlePeersChange });
        } else if (message.type === "offer") {
          await offerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "answer") {
          await answerHandler({ message: message, peers: peersRef.current });
        } else if (message.type === "iceCandidate") {
          iceCandidateHandler({ message, peers: peersRef.current });
        } else if (message.type == "trackMuted") {
          trackMutedHandler({
            peers: peersRef.current,
            message,
            handlePeersChange,
          });
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
  }, []);

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

  return (
    <div className="room-container d-flex flex-column vh-100 bg-dark">
      <div className="room-header d-flex justify-content-between align-items-center p-3">
        <h4 className="text-white m-0">{roomId || "Meeting Room"}</h4>
      </div>

      <div className="video-content flex-grow-1 overflow-auto p-3">
        <div className={`video-grid ${gridClass}`}>
          <div className="video-container position-relative">
            <div className="position-absolute z-1 bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom-3 ps-3 pe-3">
              You
            </div>
            <Video
              stream={localStreamRef.current}
              mirrored={true}
              muted={true}
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

          {/* Placeholder buttons for future functionality */}
          <button className="btn btn-outline-light rounded-circle" disabled>
            <i className="bi bi-mic"></i>
          </button>

          <button className="btn btn-outline-danger rounded-circle" disabled>
            <i className="bi bi-telephone-x"></i>
          </button>

          <button className="btn btn-outline-light rounded-circle" disabled>
            <i className="bi bi-emoji-smile"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
