import { useEffect, useState } from "react";
import { Client } from "../client";
import { OutboundOfferMessage } from "../messages/outbound";
import { Xid } from "xid-ts";

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
    console.log(`Received remote ${kind} stream`, stream);
    if (kind == "audio") setAudioStream(stream);
    if (kind == "video") setVideoStream(stream);
  };

  const restartAudio = async () => {
    // TODO: improve deviceId selection logic
    const devices = await navigator.mediaDevices.enumerateDevices();
    const [device] = devices.filter(
      (d) => d.kind === "audioinput" && d.deviceId !== "default"
    );

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          deviceId: device.deviceId,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
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
    try {
      client.makingOffer = true;
      const pc = client.peerConnection!;
      await pc.setLocalDescription();

      let offerMessage: OutboundOfferMessage = {
        type: "offer",
        payload: {
          messageId: new Xid().toString(),
          value: pc.localDescription!,
          clientId: client.id,
        },
      };
      client.ws!.send(JSON.stringify(offerMessage));
      console.log(
        "Sent offer message renegotiation",
        offerMessage.payload.value.type,
        offerMessage.payload
      );
    } catch (err) {
      console.error(err);
    } finally {
      client.makingOffer = false;
    }
  };

  useEffect(() => {
    if (client.id !== "self") {
      client.peerConnection!.addEventListener("track", onTrackListener);
    }

    navigator.mediaDevices
      .getUserMedia({
        video: {
          frameRate: 30,
          facingMode: { ideal: "user" },
          width: 300,
          height: 300,
        },
      })
      .then(
        (stream) => {
          if (client.id === "self") {
            setVideoStream(stream);
            return;
          }

          const [videoTrack] = stream.getVideoTracks();
          client.peerConnection!.addTrack(videoTrack, stream);
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
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      .then(
        (stream) => {
          const [audioTrack] = stream.getAudioTracks();
          client.peerConnection!.addTrack(audioTrack, stream);
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
