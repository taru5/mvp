import React from "react";
import { string, number } from "prop-types";

const Celo = ({ className, pathClassName, style, width }) => (
  <svg
    className={className}
    viewBox={"0 0 16 16"}
    width={`${width}px`}
    height={`${width}px`}
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    style={style}
  >
    <path
      className={pathClassName}
      d="M6.31579 14.316C8.87377 14.316 10.9474 12.2424 10.9474 9.68444C10.9474 7.12646 8.87377 5.05286 6.31579 5.05286C3.75781 5.05286 1.68421 7.12646 1.68421 9.68444C1.68421 12.2424 3.75781 14.316 6.31579 14.316ZM6.31579 16.0002C2.82779 16.0002 0 13.1724 0 9.68444C0 6.19644 2.82779 3.36865 6.31579 3.36865C9.80379 3.36865 12.6316 6.19644 12.6316 9.68444C12.6316 13.1724 9.80379 16.0002 6.31579 16.0002Z"
      fill="#FBCC5C"
    />
    <path
      className={pathClassName}
      d="M9.68444 10.9474C12.2424 10.9474 14.316 8.87377 14.316 6.31579C14.316 3.75781 12.2424 1.68421 9.68444 1.68421C7.12646 1.68421 5.05286 3.75781 5.05286 6.31579C5.05286 8.87377 7.12646 10.9474 9.68444 10.9474ZM9.68444 12.6316C6.19644 12.6316 3.36865 9.80379 3.36865 6.31579C3.36865 2.82779 6.19644 0 9.68444 0C13.1724 0 16.0002 2.82779 16.0002 6.31579C16.0002 9.80379 13.1724 12.6316 9.68444 12.6316Z"
      fill="#35D07F"
    />
    <path
      className={pathClassName}
      d="M9.89312 12.6318C10.331 12.1011 10.6449 11.4793 10.8119 10.8119C11.4793 10.645 12.1011 10.3311 12.6318 9.89328C12.6076 10.6663 12.4411 11.4282 12.1407 12.1409C11.428 12.4412 10.6661 12.6077 9.89312 12.6318ZM5.18861 5.18861C4.52114 5.35549 3.89935 5.66932 3.36865 6.10718C3.39285 5.33417 3.55934 4.57225 3.85977 3.8596C4.57243 3.55922 5.33435 3.39279 6.10735 3.36865C5.66943 3.89934 5.35555 4.52113 5.18861 5.18861Z"
      fill="#5EA33B"
    />
  </svg>
);

Celo.defaultProps = {
  className: "",
  pathClassName: "",
  width: 16
};

Celo.propTypes = {
  className: string,
  pathClassName: string,
  width: number
};

export default Celo;
