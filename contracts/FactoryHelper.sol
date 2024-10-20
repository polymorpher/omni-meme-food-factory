import {FoodMeme} from "./FoodMeme.sol";

contract FoodMemeFactoryHelper {
    function code(bytes memory args) public pure returns (bytes memory) {
        if (args.length > 0) {
            return abi.encodePacked(type(FoodMeme).creationCode, args);
        }
        return type(FoodMeme).creationCode;
    }

    function hash(bytes memory args) public pure returns (bytes32) {
        return keccak256(code(args));
    }
}
