package main

import (
	"testing"
)

func TestValidateId(t *testing.T) {
	strings := []struct {
		id   string
		pass bool
	}{
		{`aria`, false},
		{`0f3d`, true},
		{`"a80`, false},
		{`12345`, false},
		{`9D0E`, true},
		{`{aB}`, false},
		{`aE9A`, true},
		{`a8a`, false},
	}
	for _, elem := range(strings) {
		if ValidateId(elem.id) != elem.pass {
			t.FailNow()
		}
	}
}

func TestValidateCert(t *testing.T) {
	t.SkipNow()
	
	strings := []struct {
		cert string
		pass bool
	} {
		{`SELECT * FROM Users /* -----BEGIN CERTIFICATE------
		                         hi
		                         -----END CERITIFICATE----- */`, false},
	}
	for _, elem := range(strings) {
		if ValidateCert(elem.cert) != elem.pass {
			t.FailNow()
		}
    }
}

func TestValidateNonce(t *testing.T) {
	strings := []struct {
		nonce string
		pass  bool
	} {
		{`8935ba9708a15ea38a8ac0d64b2b1bb8`, true},
		{`817754005E67d6A413ACDA47A7323D60`, true},
		{`EaBb5039FD4e9c45E32831557aFEB5d2`, true},
		{`ad32de913f171903ef3c3f47a79ab9fcafe9`, false},
		{`3fdb317506dec8af8c0f351ddc`,       false},
		{`whenyourereadycomeandgetit000000`, false},
		{`"{a-f}"0000000000000000000000000`, false},
		{`[^g-z]00000000000000000000000000`, false},
	}
	
	for _, elem := range(strings) {
		if ValidateNonce(elem.nonce) != elem.pass {
			t.FailNow()
		}
	}
}

func TestValidateToken(t *testing.T) {
	strings := []struct {
		token string
		pass  bool
	} {
		{`93631b2b9ae2bb5b570df7e44af94eae`, true},
		{`E0BCD72DBD0C53F2D74AEB97D842E14B`, true},
		{`c1b9Fd7D3561a493805d6E6a2d34Eb2e`, true},
		{`f10410bebad93c7b3edb97265d9bff8cDEa`, false},
		{`36c2b7ac8f101be99c903e182f9a`,     false},
		{`imsosickofthatsameoldlove0000000`, false},
		{`"{a-f}"0000000000000000000000000`, false},
		{`[a-z] 00000000000000000000000000`, false},
	}
	
	for _, elem := range(strings) {
		if ValidateToken(elem.token) != elem.pass {
			t.FailNow()
		}
	}
}
