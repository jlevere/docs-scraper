{
  description = "A Nix-flake-based Python dev environment with uv-managed venv";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = import nixpkgs {
          inherit system;
          config.allowUnfree = true;
        };

      in {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            python313
            uv
          ];
          shellHook = ''
              export UV_NO_MANAGED_PYTHON=1
              export UV_PYTHON=${pkgs.python313}/bin/python3.13
            '';
        };
      }
    );
}
