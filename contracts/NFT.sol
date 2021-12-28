//SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./@rarible/royalties/contracts/LibPart.sol";
import "./@rarible/royalties/contracts/LibRoyaltiesV2.sol";
import "./@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";

contract NFT is ERC721, Ownable, RoyaltiesV2Impl {
    uint256 public currentSupply;
    int256 public maxSupply;
    uint256 public mintCommission;
    mapping(uint256 => string) private _tokenURIs;
    mapping(uint256 => address) private _artists;

    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    constructor(
        string memory _name,
        string memory _symbol,
        int256 _maxsupply,
        uint256 _mintCommission
    ) ERC721(_name, _symbol) {
        require(_maxsupply >= -1, "Invalid max supply");

        currentSupply = 0;
        maxSupply = _maxsupply;
        mintCommission = _mintCommission;
    }

    function mint(string memory _tokenURI, uint96 royaltyPercent)
        public
        payable
    {
        require(
            msg.value >= mintCommission || msg.sender == owner(),
            "Not enought ETH"
        );
        require(
            maxSupply == -1 || currentSupply < uint256(maxSupply),
            "Max supply reached"
        );
        require(
            royaltyPercent <= 100 && royaltyPercent >= 0,
            "Royalties must be between 0 and 100"
        );

        _safeMint(msg.sender, currentSupply);
        _setTokenURI(currentSupply, _tokenURI);
        _artists[currentSupply] = msg.sender;
        setRoyalties(currentSupply, payable(msg.sender), royaltyPercent);

        if (msg.value > mintCommission) {
            payable(msg.sender).transfer(msg.value - mintCommission);
        }

        currentSupply++;
    }

    function _setTokenURI(uint256 _tokenId, string memory _tokenURI)
        internal
        virtual
    {
        require(
            _exists(_tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );

        _tokenURIs[_tokenId] = _tokenURI;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId) && _tokenId < currentSupply,
            "ERC721Metadata: URI get of nonexistent token"
        );

        return _tokenURIs[_tokenId];
    }

    function setRoyalties(
        uint256 _tokenId,
        address payable _royaltiesReceipientAddress,
        uint96 _percentage
    ) public {
        require(
            _artists[_tokenId] == msg.sender,
            "Only the original artist can set royalties"
        );

        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        _royalties[0].value = _percentage * 100; // Convert to percentage basis points
        _royalties[0].account = _royaltiesReceipientAddress;
        _saveRoyalties(_tokenId, _royalties);
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_tokenId < currentSupply, "Token does not exist");
        LibPart.Part[] memory _royalties = royalties[_tokenId];
        if (_royalties.length > 0) {
            LibPart.Part memory latestRoyalty = _royalties[
                _royalties.length - 1
            ];
            uint256 _royaltyAmount = (latestRoyalty.value * _salePrice) / 10000;
            return (latestRoyalty.account, _royaltyAmount);
        }
        return (address(0), 0);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721)
        returns (bool)
    {
        if (
            interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES ||
            interfaceId == _INTERFACE_ID_ERC2981
        ) {
            return true;
        }
        return super.supportsInterface(interfaceId);
    }

    function transferCommission(address to) public onlyOwner {
        payable(to).transfer(address(this).balance);
    }
}
