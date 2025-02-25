import React from "react";
import { lightPrimary, lightSurfaceHover } from "src/utils/colors";

const ChatLight = ({ height = "32", width = "32" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill={lightSurfaceHover} />
    <path
      d="M8.93323 10.4953C8.82914 10.3091 8.78735 10.0944 8.81396 9.88276C8.84057 9.67107 8.93419 9.47345 9.08113 9.31876C9.22807 9.16407 9.42063 9.06044 9.63067 9.023C9.84071 8.98556 10.0572 9.01628 10.2486 9.11067L22.9246 15.55C23.0068 15.5918 23.0759 15.6556 23.1241 15.7343C23.1724 15.8129 23.1979 15.9034 23.1979 15.9957C23.1979 16.0879 23.1724 16.1784 23.1241 16.2571C23.0759 16.3357 23.0068 16.3995 22.9246 16.4413L10.2486 22.8893C10.0572 22.9837 9.84071 23.0144 9.63067 22.977C9.42063 22.9396 9.22807 22.8359 9.08113 22.6812C8.93419 22.5266 8.84057 22.3289 8.81396 22.1172C8.78735 21.9056 8.82914 21.6909 8.93323 21.5047L12.3052 15.9953L8.93323 10.4953Z"
      stroke={lightPrimary}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M23.198 15.9953H12.302" stroke={lightPrimary} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ChatLight;
