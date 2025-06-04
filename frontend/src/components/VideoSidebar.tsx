import { Peer } from "../peer";
import { User } from "../services/authService";
import PeerComponent from "./Peer";
import Video from "./Video";

interface VideoSidebarProps {
  peers: Peer[];
  localStream: MediaStream;
  currentUser: User | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  maxVisibleParticipants?: number;
}

const VideoSidebar = ({
  peers,
  localStream,
  currentUser,
  isVideoEnabled,
  isAudioEnabled,
  maxVisibleParticipants = 4,
}: VideoSidebarProps) => {
  // Don't filter out screen sharing peers - show them in sidebar too
  const sidebarPeers = peers;

  const totalParticipants = sidebarPeers.length + 1; // Including local user
  const hiddenParticipants = Math.max(
    0,
    totalParticipants - maxVisibleParticipants
  );
  const visiblePeers = sidebarPeers.slice(0, maxVisibleParticipants - 1);

  return (
    <div className="video-sidebar d-flex flex-column gap-3 h-100">
      {/* Local user video */}
      <div className="video-sidebar-item">
        <div className="position-relative">
          <div className="position-absolute z-1 bottom-0 start-0 p-2 text-white bg-dark bg-opacity-50 rounded-bottom-3 ps-2 pe-2">
            <small>
              {currentUser?.username || "Ви"}
              <i
                className={`ms-1 bi ${
                  isAudioEnabled ? "" : "bi-mic-mute-fill text-danger"
                }`}
              ></i>
            </small>
          </div>
          <Video
            stream={localStream}
            mirrored={true}
            muted={true}
            username={currentUser?.username || "Ви"}
            showPlaceholder={!isVideoEnabled}
          />
        </div>
      </div>

      {/* Visible peers */}
      {visiblePeers.map((peer) => (
        <div key={peer.id} className="video-sidebar-item">
          <div className="position-relative">
            {/* Screen sharing indicator for peers */}
            {peer.isScreenSharing && (
              <div className="position-absolute top-0 end-0 p-1 z-2">
                <div className="bg-primary bg-opacity-75 text-white px-2 py-1 rounded-pill">
                  <i
                    className="bi bi-display me-1"
                    style={{ fontSize: "0.7rem" }}
                  ></i>
                  <small style={{ fontSize: "0.65rem" }}>Екран</small>
                </div>
              </div>
            )}
            <PeerComponent peer={peer} isVideoEnabled={isVideoEnabled} />
          </div>
        </div>
      ))}

      {/* Hidden participants indicator */}
      {hiddenParticipants > 0 && (
        <div className="video-sidebar-item">
          <div className="d-flex align-items-center justify-content-center h-100 w-100 bg-dark text-white rounded-3 border border-secondary">
            <div className="text-center">
              <i className="bi bi-people display-6 mb-2 opacity-75"></i>
              <div className="fw-medium">+{hiddenParticipants}</div>
              <small className="text-muted">
                {hiddenParticipants === 1 ? "учасник" : "учасників"}
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSidebar;
