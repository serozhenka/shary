import { useEffect, useState } from "react";
import { Client } from "../client";
import { OutboundOfferMessage } from "../messages/outbound";

export interface ClientProps {
  client: Client;
}

interface OnTrackListenerProps {
  streams: readonly MediaStream[];
  track: { kind: string };
}

const ClientComponent = ({ client }: ClientProps) => {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);

  const onTrackListener = ({
    streams: [stream],
    track: { kind },
  }: OnTrackListenerProps) => {
    if (kind == "audio") setAudioStream(stream);
    if (kind == "video") setVideoStream(stream);
    console.log("Received remote stream", stream, kind);
  };

  const restartAudio = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const [device] = devices.filter(
      (d) => d.kind === "audioinput" && d.deviceId !== "default"
    );

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: device.deviceId,
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then((stream) => {
        setAudioStream(stream);
        const [audioTrack] = stream.getAudioTracks();
        const [sender] = client
          .peerConnection!.getSenders()
          .filter((sender) => sender.track!.kind == "audio");

        sender.replaceTrack(audioTrack);
      });
  };

  const renegotiate = async () => {
    console.log("Renogiating", client.id);
    const pc = client.peerConnection!;
    pc.createOffer().then((offer) => {
      pc.setLocalDescription(new RTCSessionDescription(offer));
      let offerMessage: OutboundOfferMessage = {
        type: "offer",
        payload: { value: offer, clientId: client.id },
      };
      client.ws!.send(JSON.stringify(offerMessage));
      console.log("Sent offer message", offerMessage);
    });
  };

  useEffect(() => {
    if (client.id !== "self") {
      client.peerConnection!.addEventListener("track", onTrackListener);
    }

    navigator.mediaDevices
      .getUserMedia({ video: { frameRate: 60, facingMode: { ideal: "user" } } })
      .then(
        (stream) => {
          if (client.id === "self") {
            setVideoStream(stream);
            return;
          }

          const [videoTrack] = stream.getVideoTracks();
          client.peerConnection!.addTrack(videoTrack, stream);
          console.log("Adding video track", client.id);
        },
        (error) => {
          console.log("error", error);
        }
      );

    return () => {
      if (client.id !== "self") {
        client.peerConnection!.removeEventListener("track", onTrackListener);
      }

      if (!videoStream) return;
      videoStream.getVideoTracks().map((track) => track.stop());
      if (videoStream.stop) videoStream.stop();
    };
  }, []);

  useEffect(() => {
    if (client.id === "self") return;

    navigator.mediaDevices.addEventListener("devicechange", restartAudio);
    client.peerConnection!.addEventListener("track", onTrackListener);
    client.peerConnection!.addEventListener("negotiationneeded", renegotiate);

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
      .then(
        (stream) => {
          const [audioTrack] = stream.getAudioTracks();
          client.peerConnection!.addTrack(audioTrack, stream);
          console.log("Adding audio track", client.id);
        },
        (error) => {
          console.warn(error.message);
        }
      );

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", restartAudio);
      client.peerConnection!.removeEventListener("track", onTrackListener);
      client.peerConnection!.removeEventListener(
        "negotiationneeded",
        renegotiate
      );

      if (!audioStream) return;
      audioStream.getAudioTracks().map((track) => track.stop());
      if (audioStream.stop) audioStream.stop();
    };
  }, []);

  return (
    <>
      <div>showing client {client.id}</div>
      <video
        width={0}
        height={0}
        autoPlay
        ref={(audio) => {
          if (audio) {
            audio.srcObject = audioStream;
          }
        }}
      ></video>
      <video
        autoPlay
        className={client.id === "self" ? "self-video" : ""}
        ref={(video) => {
          if (video) {
            video.srcObject = videoStream;
          }
        }}
      ></video>
    </>
  );
};

export default ClientComponent;
