import { useEffect, useRef, useState } from "react";
import { Client } from "../client";
import {
  OutboundIceCandidateMessage,
  OutboundOfferMessage,
} from "../messages/outbound";
import { Xid } from "xid-ts";

export interface ClientProps {
  client: Client;
  isVideoEnabled: boolean;
}

const ClientComponent = ({ client, isVideoEnabled }: ClientProps) => {
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const videoStreamRef = useRef(videoStream);
  const videoObjectRef = useRef<HTMLVideoElement | null>(null);

  const onTrackListener = ({
    streams: [stream],
    track: { kind },
    track,
  }: RTCTrackEvent) => {
    console.log(`Received remote ${kind} stream`, stream);
    if (kind == "audio") setAudioStream(stream);
    if (kind == "video")
      setVideoStream(() => {
        videoStreamRef.current = stream;
        if (videoObjectRef.current) {
          videoObjectRef.current.srcObject = stream;
        }
        track.onmute = () => {
          if (videoObjectRef.current) {
            videoObjectRef.current.srcObject = null;
          }
        };
        return stream;
      });
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
        client.peerConnection!.addTrack(audioTrack, stream);
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

  const onIceCandidateHandler = async ({
    candidate,
  }: RTCPeerConnectionIceEvent) => {
    if (candidate) {
      let iceCandidateMessage: OutboundIceCandidateMessage = {
        type: "iceCandidate",
        payload: {
          messageId: new Xid().toString(),
          value: candidate,
          clientId: client.id,
        },
      };
      client.ws!.send(JSON.stringify(iceCandidateMessage));
    }
  };

  const onIceConnectionStateChangeHandler = async () => {
    if (client.id === "self") return;
    const pc = client.peerConnection!;
    if (pc.iceConnectionState == "failed") {
      pc.restartIce();
      console.log(`Restarting ICE, client id: ${client.id}`);
    }
  };

  useEffect(() => {
    if (client.id === "self") return;

    navigator.mediaDevices.addEventListener("devicechange", restartAudio);
    client.peerConnection!.addEventListener("track", onTrackListener);
    client.peerConnection!.addEventListener("negotiationneeded", renegotiate);
    client.peerConnection!.addEventListener(
      "icecandidate",
      onIceCandidateHandler
    );
    client.peerConnection!.addEventListener(
      "iceconnectionstatechange",
      onIceConnectionStateChangeHandler
    );

    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", restartAudio);
      client.peerConnection!.removeEventListener("track", onTrackListener);
      client.peerConnection!.removeEventListener(
        "negotiationneeded",
        renegotiate
      );
      client.peerConnection!.removeEventListener(
        "icecandidate",
        onIceCandidateHandler
      );
      client.peerConnection!.removeEventListener(
        "iceconnectionstatechange",
        onIceConnectionStateChangeHandler
      );
    };
  });

  useEffect(() => {
    console.log(`inside video effect ${client.id}`, isVideoEnabled);
    if (!isVideoEnabled) {
      return;
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
            setVideoStream(() => {
              videoStreamRef.current = stream;
              if (videoObjectRef.current) {
                videoObjectRef.current.srcObject = stream;
              }
              return stream;
            });
          } else {
            const [videoTrack] = stream.getVideoTracks();
            console.log("Adding track to the remote ocnnection", videoTrack);
            client.peerConnection!.addTrack(videoTrack, stream);
          }
        },
        (error) => {
          console.log("error", error);
        }
      );

    return () => {
      if (client.id === "self") {
        if (videoStreamRef.current) {
          videoStreamRef.current.getTracks().map((track) => track.stop());
        }
        if (videoObjectRef.current) {
          videoObjectRef.current.srcObject = null;
        }
      } else {
        const [sender] = client
          .peerConnection!.getSenders()
          .filter((s) => s.track?.kind == "video");

        sender.track!.stop();
      }
    };
  }, [isVideoEnabled]);

  useEffect(() => {
    if (client.id === "self") return;

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
      if (!audioStream) return;
      audioStream.getAudioTracks().map((track) => track.stop());
      if (audioStream.stop) audioStream.stop();
    };
  }, []);

  return (
    <div className="position-relative d-block">
      <div className="position-absolute z-1 bottom-0 mb-3 ms-3 text-white">
        showing client {client.id}
      </div>
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
        width={300}
        height={300}
        className={`${
          client.id === "self" ? "self-video" : ""
        } bg-secondary-subtle rounded-2 z-0 m-2`}
        ref={videoObjectRef}
      ></video>
    </div>
  );
};

export default ClientComponent;
