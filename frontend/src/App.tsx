import { useEffect, useRef, useState } from "react";
import { InboundMessage } from "./messages/inbound";
import { Peer } from "./peer";
import PeerComponent from "./components/Peer";
import Video from "./components/Video";
import { initHandler } from "./messages/handlers/init";
import { offerHandler } from "./messages/handlers/offer";
import { answerHandler } from "./messages/handlers/answer";
import { clientJoinedHandler } from "./messages/handlers/client_joined";
import { clientLeftHandler } from "./messages/handlers/client_left";
import { iceCandidateHandler } from "./messages/handlers/iceCandidate";
import { OutboundTrackMutedMessage } from "./messages/outbound";
import { trackMutedHandler } from "./messages/handlers/trackMuted";

function App() {
  const [peers, setPeers] = useState<Peer[]>([]);
  const peersRef = useRef(peers);
  const [isVideoEnabled, setVideoEnabled] = useState(true);
  const localStreamRef = useRef(new MediaStream());
  const wsRef = useRef<WebSocket | null>(null);

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: "turn:relay1.expressturn.com:3478",
        username: "efP3E1U17Q3XOFQXWX",
        credential: "cNizl5i0f1JR5AhE",
      },
    ],
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
        if (!videoTrack) return prevIsEnabled;

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
              width: 300,
              height: 300,
            },
          })
          .then((stream) => {
            const [track] = stream.getVideoTracks();
            localStreamRef.current.addTrack(track);
            peersRef.current.forEach((peer) => peer.pc.addTrack(track));
          });
      }

      return isEnabled;
    });
  };

  useEffect(() => {
    (async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          frameRate: 30,
          facingMode: { ideal: "user" },
          width: 300,
          height: 300,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.getTracks().forEach((track) => {
        localStreamRef.current.addTrack(track);
      });

      const ws = new WebSocket(`ws://${window.location.hostname}:8000/ws`);
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

      return () => {
        peers.forEach((client) => client.pc?.close());
        ws.close();

        const localStream = localStreamRef.current;
        if (!localStream) return;
        localStream.getAudioTracks().forEach((track) => {
          track.stop();
          localStream.removeTrack(track);
        });
      };
    })();
  }, []);

  return (
    <>
      <div className="d-flex">
        <Video stream={localStreamRef.current} mirrored={true} muted={true} />
        {peers.map((peer) => (
          <PeerComponent
            key={peer.id}
            peer={peer}
            isVideoEnabled={isVideoEnabled}
          />
        ))}
      </div>
      <button onClick={handleToogleVideo} className={"btn btn-primary"}>
        Toogle video
      </button>
    </>
  );
}

export default App;
